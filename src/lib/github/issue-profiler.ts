import { getRepoInfo, getRepoContents, parseGitHubUrl } from "./client";

interface IssueProfile {
  language: string | null;
  frameworks: string[];
  difficulty: number;
  issueType: "BUG" | "FEATURE" | "REFACTOR";
  scope: "SINGLE_MODULE" | "MULTI_MODULE" | "FULL_STACK";
}

const FRAMEWORK_INDICATORS: Record<string, string[]> = {
  react: ["react", "react-dom", "next"],
  "next.js": ["next"],
  vue: ["vue"],
  angular: ["@angular/core"],
  express: ["express"],
  fastapi: ["fastapi"],
  django: ["django"],
  flask: ["flask"],
  prisma: ["prisma", "@prisma/client"],
  tailwind: ["tailwindcss"],
};

function guessTypeFromLabels(labels: string[]): "BUG" | "FEATURE" | "REFACTOR" {
  const lower = labels.map((l) => l.toLowerCase());
  if (lower.some((l) => l.includes("bug") || l.includes("fix"))) return "BUG";
  if (lower.some((l) => l.includes("feature") || l.includes("enhancement"))) return "FEATURE";
  if (lower.some((l) => l.includes("refactor") || l.includes("cleanup"))) return "REFACTOR";
  return "BUG";
}

function guessDifficultyFromLabels(labels: string[]): number {
  const lower = labels.map((l) => l.toLowerCase());
  if (lower.some((l) => l.includes("good first issue") || l.includes("beginner"))) return 1;
  if (lower.some((l) => l.includes("easy"))) return 2;
  if (lower.some((l) => l.includes("medium"))) return 3;
  if (lower.some((l) => l.includes("hard") || l.includes("complex"))) return 4;
  if (lower.some((l) => l.includes("expert"))) return 5;
  return 3;
}

export async function profileIssue(
  githubUrl: string,
  labels: string[],
  body: string
): Promise<IssueProfile> {
  const { owner, repo } = parseGitHubUrl(githubUrl);

  // Get repo primary language
  const repoInfo = await getRepoInfo(owner, repo);
  const language = repoInfo.language;

  // Try to detect frameworks from package.json or requirements.txt
  const frameworks: string[] = [];
  try {
    const pkgJson = await getRepoContents(owner, repo, "package.json");
    if (pkgJson && "content" in pkgJson) {
      const content = JSON.parse(Buffer.from(pkgJson.content, "base64").toString());
      const allDeps = { ...content.dependencies, ...content.devDependencies };
      for (const [framework, indicators] of Object.entries(FRAMEWORK_INDICATORS)) {
        if (indicators.some((ind) => ind in allDeps)) {
          frameworks.push(framework);
        }
      }
    }
  } catch {
    // ignore — not a JS project
  }

  return {
    language,
    frameworks,
    difficulty: guessDifficultyFromLabels(labels),
    issueType: guessTypeFromLabels(labels),
    scope: body.length > 2000 ? "MULTI_MODULE" : "SINGLE_MODULE",
  };
}
