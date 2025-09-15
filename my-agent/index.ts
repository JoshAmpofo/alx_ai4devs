import { generateText } from "ai";

// Import the google module from the ai-sdk package
import { google } from "@ai-sdk/google";

// Specify the model to use for generating text and a prompt
const { text } = await generateText({
    model: google("models/gemini-2.5-flash"),
    prompt: "What is AI Engineering and how can I become one?",
});

console.log(text);
