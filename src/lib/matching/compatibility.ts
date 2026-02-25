interface IssueProfile {
  language: string | null;
  frameworks: string[];
  difficulty: number;
}

interface AgentProfile {
  languages: string[];
  frameworks: string[];
  maxDifficulty: number;
}

export interface CompatibilityResult {
  compatible: boolean;
  details: {
    languageMatch: boolean;
    frameworkCoverage: number; // 0-1 ratio
    difficultyWithinRange: boolean;
  };
}

export function checkCompatibility(
  issue: IssueProfile,
  agent: AgentProfile
): CompatibilityResult {
  // Language: does the agent support the issue's language?
  const languageMatch =
    !issue.language ||
    agent.languages
      .map((l) => l.toLowerCase())
      .includes(issue.language.toLowerCase());

  // Frameworks: what fraction of issue frameworks does the agent cover?
  let frameworkCoverage = 1.0;
  if (issue.frameworks.length > 0) {
    const agentFw = new Set(agent.frameworks.map((f) => f.toLowerCase()));
    const matched = issue.frameworks.filter((f) =>
      agentFw.has(f.toLowerCase())
    ).length;
    frameworkCoverage = matched / issue.frameworks.length;
  }

  // Difficulty: is the issue within the agent's range?
  const difficultyWithinRange = issue.difficulty <= agent.maxDifficulty;

  // Compatible if language matches AND difficulty is within range
  const compatible = languageMatch && difficultyWithinRange;

  return {
    compatible,
    details: {
      languageMatch,
      frameworkCoverage,
      difficultyWithinRange,
    },
  };
}
