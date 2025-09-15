// import { generateText } from "ai";
import { stepCountIs, streamText } from "ai";
// Import the google module from the ai-sdk package
import { google } from "@ai-sdk/google";
// import the system prompt
import { SYSTEM_PROMPT } from "./prompts";
// import tool schema
import { getFileChangesInDirectoryTool } from "./tools";


// code review agent schema
const codeReviewAgent = async (prompt: string) => {
    const result = streamText({
        model: google("models/gemini-2.5-flash"),
        prompt,
        system: SYSTEM_PROMPT,
        tools: {
            getFileChangesInDirectoryTool: getFileChangesInDirectoryTool,
        },
        stopWhen: stepCountIs(10),
});

for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
}

};

// specify which directory the code review agent should review changesin your prompt

await codeReviewAgent (
    "Review the code changes in '../my-agent' directory, make your reviews and suggestions file by file",
);