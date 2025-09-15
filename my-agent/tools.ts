// Defining tool schema
import { tool } from "ai";
import { simpleGit } from "simple-git";
import { z } from "zod";
import { writeFile } from "fs/promises";
import { join } from "path";


const excludeFiles = ["dist", "bun.lock"];

const fileChange = z.object({
    rootDir: z.string().min(1).describe("The root directory"),   
});


type FileChange = z.infer<typeof fileChange>;

const commitMessageSchema = z.object({
    changes: z.array(z.object({
        file: z.string(),
        diff: z.string()
    })).describe("Array of file changes with their diffs"),
});


const markdownGenerationSchema = z.object({
    title: z.string().describe("Title for the markdown document"),
    content: z.string().describe("Main content for the markdown document"),
    outputPath: z.string().describe("Path where the markdown file should be saved"),
});

async function getFileChangesInDirectory({ rootDir }: FileChange) {
    const git = simpleGit(rootDir);
    const summary = await git.diffSummary();
    const diffs: { file: string; diff: string }[] = [];

    for (const file of summary.files) {
        if (excludeFiles.includes(file.file)) continue;
        const diff = await git.diff(["--", file.file]);
        diffs.push({ file: file.file, diff });
    }

    return diffs;
}

async function generateCommitMessage({ changes}: z.infer<typeof commitMessageSchema>) {
    if (changes.length === 0) {
        return "No changes detected";
    }

    const fileNames = changes.map(change => change.file);
    const hasNewFiles = changes.some(change => change.diff.includes("new file mode"));
    const hasDeletedFiles = changes.some(change => change.diff.includes("deleted file mode"));
    const hasModifications = changes.some(change => 
        !change.diff.includes("new file mode") && !change.diff.includes("deleted file mode")
    );

    let commitType = "feat";
    if (hasDeletedFiles) commitType = "remove";
    else if (hasNewFiles && !hasModifications) commitType = "add";
    else if (hasModifications && !hasNewFiles) commitType = "update";

    const scope = fileNames.length === 1 ? fileNames[0].split('.')[0] : "multiple";
    const description = fileNames.length === 1 
        ? `update ${fileNames[0]}`
        : `update ${fileNames.length} files`;
    
    return `${commitType}(${scope}): ${description}`;
}


async function generateMarkdownFile({ title, content, outputPath }: z.infer<typeof markdownGenerationSchema>) {
    const markdownContent = `# ${title}

${content}

---
*Generated on ${new Date().toISOString().split('T')[0]}*
`;

    try {
        await writeFile(outputPath, markdownContent, 'utf-8');
        return {
            success: true,
            message: `Markdown file generated successfully at ${outputPath}`,
            path: outputPath
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to generate markdown file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            path: null
        };
    }
}

export const getFileChangesInDirectoryTool = tool({
    description: "Gets the code changes made in given directory",
    inputSchema: fileChange,
    execute: getFileChangesInDirectory,
});


export const generateCommitMessageTool = tool({
    description: "Generates a conventional commit message based on file changes",
    inputSchema: commitMessageSchema,
    execute: generateCommitMessage,
});


export const generateMarkdownFileTool = tool({
    description: "Generates a markdown file with specified title and content",
    inputSchema: markdownGenerationSchema,
    execute: generateMarkdownFile,
});
