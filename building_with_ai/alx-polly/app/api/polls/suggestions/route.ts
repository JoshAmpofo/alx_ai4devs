
// app/api/polls/suggestions/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Check if API key is available
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: Request) {
  // Check if API key is available
  if (!apiKey || !genAI) {
    console.error('Gemini API key is not configured');
    return new NextResponse('AI service is not configured', { status: 503 });
  }

  let question = '';
  let options: string[] = [];

  try {
    const body = await request.json();
    question = body.question;
    options = body.options;

    if (!question || !options) {
      return new NextResponse('Question and options are required', { status: 400 });
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
      return new NextResponse('AI service temporarily unavailable', { status: 503 });
    }
    
    console.log(`Using model: ${modelName}`);

    const prompt = `
Improve this poll question and options to be clearer and less biased.

Question: "${question}"
Options: ${options.join(', ')}

Return JSON format:
{
  "questionSuggestions": ["suggestion 1", "suggestion 2"],
  "optionSuggestions": [["option 1", "option 2"], ["option A", "option B"]]
}
`;

    console.log('Generating AI suggestions for question:', question);
    
    // Add timeout to the API call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
    });
    
    const aiPromise = async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return await response.text();
    };
    
    const text = await Promise.race([aiPromise(), timeoutPromise]) as string;
    
    console.log('AI response received:', text.substring(0, 100) + '...');
    
    // Clean the response to ensure it's valid JSON
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let jsonResponse;
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
    
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for specific API quota/billing errors
      if (error.message.includes('quota') || error.message.includes('billing') || error.message.includes('exceeded')) {
        console.error('API quota/billing issue detected');
        return new NextResponse('AI service quota exceeded. Please try again later.', { status: 429 });
      }
      
      // Check for network/fetch errors
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        console.error('Network connectivity issue detected');
        return new NextResponse('Network error connecting to AI service. Please try again.', { status: 503 });
      }
      
      // Check for timeout errors
      if (error.message.includes('timeout')) {
        console.error('Request timeout detected');
        return new NextResponse('AI service request timed out. Please try again.', { status: 504 });
      }
    }
    
    // Return a fallback response instead of just failing
    const fallbackResponse = {
      questionSuggestions: [
        question ? `How do you feel about ${question.toLowerCase()}?` : 'How do you feel about this topic?',
        question ? `What is your opinion on ${question.toLowerCase()}?` : 'What is your opinion on this topic?'
      ],
      optionSuggestions: [
        options.length > 0 ? options.map((opt: string) => `${opt} (Yes)`) : ['Option 1', 'Option 2'],
        options.length > 0 ? options.map((opt: string) => `${opt} (No)`) : ['Choice A', 'Choice B']
      ]
    };
    
    console.log('Returning fallback response due to AI service error');
    return NextResponse.json(fallbackResponse);
  }
}
