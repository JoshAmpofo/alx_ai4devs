// import { generateText } from "ai";
import { stepCountIs, streamText } from "ai";
// Import the google module from the ai-sdk package
import { google } from "@ai-sdk/google";
// import the system prompt
import { SYSTEM_PROMPT } from "./prompts";
// import tool schema
import { getFileChangesInDirectoryTool, generateCommitMessageTool, generateMarkdownFileTool } from "./tools";


// code review agent schema
const codeReviewAgent = async (prompt: string) => {
    const result = streamText({
        model: google("models/gemini-2.5-flash"),
        prompt,
        system: SYSTEM_PROMPT,
        tools: {
            getFileChangesInDirectoryTool: getFileChangesInDirectoryTool,
            generateCommitMessageTool: generateCommitMessageTool,
            generateMarkdownFileTool: generateMarkdownFileTool,
        },
        stopWhen: stepCountIs(10),
});

for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
}

};

const commitMessageAgent = async (directoryPath: string) => {
    const result = streamText({
        model: google("models/gemini-2.5-flash"),
        prompt: `Analyze the git changes in the directory "${directoryPath}" and generate an appropriate commit message using conventional commit format.`,
        system: "You are a helpful assistant that generates conventional commit messages based on code changes. Analyze the changes and create a concise, descriptive commit message.",
        tools: {
            getFileChangesInDirectoryTool: getFileChangesInDirectoryTool,
            generateCommitMessageTool: generateCommitMessageTool,
        },
        stopWhen: stepCountIs(5),
    });

    for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
    }
};

const markdownGeneratorAgent = async (title: string, content: string, outputPath: string) => {
    const result = streamText({
        model: google("models/gemini-2.5-flash"),
        prompt: `Generate a markdown file with title "${title}" and save it to "${outputPath}". The content should be: ${content}`,
        system: "You are a helpful assistant that generates well-formatted markdown files. Create clean, readable markdown content.",
        tools: {
            generateMarkdownFileTool: generateMarkdownFileTool,
        },
        stopWhen: stepCountIs(3),
    });

    for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
    }
};

// specify which directory the code review agent should review changesin your prompt

await codeReviewAgent (
    "Review the code changes in '.' directory, make your reviews and suggestions file by file",
);

// Generate commit message for current directory
await commitMessageAgent(".");

// Generate a markdown file
await markdownGeneratorAgent(
     "Code Review Report", 
     "This document contains the code review analysis and recommendations.", 
     "./code-review-report.md"
);