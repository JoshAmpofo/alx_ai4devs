'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface SuggestionRequest {
  question: string;
  options: string[];
}

export interface SuggestionResponse {
  questionSuggestions: string[];
  optionSuggestions: string[][];
}

export async function generatePollSuggestions(data: SuggestionRequest): Promise<SuggestionResponse> {
  try {
    // Check if API key is available at runtime
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      throw new Error('AI service is not configured');
    }

    // Initialize the AI client with the validated API key
    const genAI = new GoogleGenerativeAI(apiKey);

    const { question, options } = data;

    if (!question || !options || options.length === 0) {
      throw new Error('Question and options are required');
    }

    // Try different models in order of preference for free tier
    let model;
    let modelName = '';
    
    // List of models to try in order (free tier compatible)
    const modelsToTry = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-pro',
      'gemini-1.5-pro-latest'
    ];
    
    for (const modelToTry of modelsToTry) {
      try {
        console.log(`Trying model: ${modelToTry}`);
        model = genAI.getGenerativeModel({ 
          model: modelToTry,
          generationConfig: {
            maxOutputTokens: 500, // Limit output for free tier
            temperature: 0.7,
          }
        });
        modelName = modelToTry;
        break;
      } catch (modelError) {
        console.log(`Model ${modelToTry} not available:`, modelError);
        continue;
      }
    }
    
    if (!model) {
      console.error('No available models found');
      throw new Error('AI service temporarily unavailable');
    }
    
    console.log(`Using model: ${modelName}`);

    const prompt = `
You are an expert survey designer tasked with improving poll questions for clarity, neutrality, and engagement.

ORIGINAL POLL:
Question: "${question}"
Options: ${options.join(', ')}

INSTRUCTIONS:
1. REWRITE the question for maximum clarity and neutrality
2. REDUCE bias, leading language, and loaded terms
3. IMPROVE engagement while maintaining conciseness (max 100 characters per question)
4. PRESERVE the original intent and ensure all options remain answerable
5. MAINTAIN the exact same number of options as provided (${options.length} options)
6. DO NOT add, remove, or substantially change the meaning of options
7. PROVIDE exactly 3 question alternatives and 2 sets of improved options

QUALITY CRITERIA:
- Use simple, direct language
- Avoid emotional or charged words
- Ensure options are mutually exclusive and comprehensive
- Make questions specific enough to be actionable
- Use active voice when possible
- Avoid double-barreled questions

EXAMPLE INPUT:
Question: "Don't you think cats are way better than dogs?"
Options: ["Yes, obviously", "No, dogs rule", "I hate both"]

EXAMPLE OUTPUT:
{
  "questionSuggestions": [
    "Which pet do you prefer?",
    "What type of companion animal appeals to you most?",
    "If you were to choose a pet, which would you select?"
  ],
  "optionSuggestions": [
    ["Cats", "Dogs", "Neither"],
    ["Felines", "Canines", "No preference"]
  ]
}

REQUIRED JSON FORMAT (return only valid JSON, no extra text):
{
  "questionSuggestions": ["question 1", "question 2", "question 3"],
  "optionSuggestions": [["option set 1"], ["option set 2"]]
}

Each option set must contain exactly ${options.length} options.
`;

    console.log('Generating AI suggestions for question:', question);
    
    // Add timeout to the AI call
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
    });
    
    const aiPromise = async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return await response.text();
    };
    
    const text = await Promise.race([aiPromise(), timeoutPromise]);
    
    console.log('AI response received:', text.substring(0, 100) + '...');
    
    // Clean the response to ensure it's valid JSON
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let jsonResponse: SuggestionResponse;
    try {
      jsonResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', text);
      
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          jsonResponse = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          throw new Error('Could not parse AI response as valid JSON');
        }
      } else {
        throw new Error('No JSON found in AI response');
      }
    }

    // Validate the response structure
    if (!jsonResponse.questionSuggestions || !jsonResponse.optionSuggestions) {
      throw new Error('Invalid response format from AI service');
    }
    
    // Validate that we have the expected number of suggestions
    if (!Array.isArray(jsonResponse.questionSuggestions) || jsonResponse.questionSuggestions.length !== 3) {
      console.warn('Expected 3 question suggestions, got:', jsonResponse.questionSuggestions?.length);
    }
    
    if (!Array.isArray(jsonResponse.optionSuggestions) || jsonResponse.optionSuggestions.length !== 2) {
      console.warn('Expected 2 option sets, got:', jsonResponse.optionSuggestions?.length);
    }
    
    // Validate that each option set has the correct number of options
    jsonResponse.optionSuggestions.forEach((optionSet, index) => {
      if (!Array.isArray(optionSet) || optionSet.length !== options.length) {
        console.warn(`Option set ${index + 1} has ${optionSet?.length} options, expected ${options.length}`);
      }
    });
    
    // Ensure we have at least some valid suggestions
    if (jsonResponse.questionSuggestions.length === 0) {
      throw new Error('No question suggestions received from AI service');
    }
    
    if (jsonResponse.optionSuggestions.length === 0) {
      throw new Error('No option suggestions received from AI service');
    }
    
    return jsonResponse;
    
  } catch (error) {
    console.error('Error generating suggestions:', error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for specific API quota/billing errors
      if (error.message.includes('quota') || error.message.includes('billing') || error.message.includes('exceeded')) {
        console.error('API quota/billing issue detected');
        throw new Error('AI service quota exceeded. Please try again later.');
      }
      
      // Check for network/fetch errors
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        console.error('Network connectivity issue detected');
        throw new Error('Network error connecting to AI service. Please try again.');
      }
      
      // Check for timeout errors
      if (error.message.includes('timeout')) {
        console.error('Request timeout detected');
        throw new Error('AI service request timed out. Please try again.');
      }
    }
    
    // Return a high-quality fallback response that follows our criteria
    const fallbackResponse: SuggestionResponse = {
      questionSuggestions: [
        // More neutral and clear versions of the original question
        data.question ? `What is your preference regarding ${data.question.toLowerCase().replace(/\?$/, '')}?` : 'What is your preference on this topic?',
        data.question ? `How would you respond to: ${data.question.replace(/\?$/, '')}?` : 'How would you respond to this question?',
        data.question ? `Which option best represents your view on ${data.question.toLowerCase().replace(/\?$/, '')}?` : 'Which option best represents your view?'
      ],
      optionSuggestions: [
        // Keep original options but ensure they match the expected count
        data.options.length > 0 ? data.options : ['Option 1', 'Option 2'],
        // Create a cleaner alternative set
        data.options.length > 0 
          ? data.options.map((opt: string, index: number) => `Choice ${String.fromCharCode(65 + index)}: ${opt}`)
          : ['Choice A', 'Choice B']
      ]
    };
    
    console.log('Returning fallback response due to AI service error');
    return fallbackResponse;
  }
}
