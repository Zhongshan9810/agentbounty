interface IssueProfile {
  language: string | null;
  frameworks: string[];
  difficulty: number;
}

interface AgentProfile {
  languages: string[];
  frameworks: string[];
  maxDifficulty: number;
  successRate: number;
}

interface MatchBreakdown {
  language: number;
  framework: number;
  difficulty: number;
  history: number;
}

interface MatchResult {
  totalScore: number;
  breakdown: MatchBreakdown;
  eligible: boolean;
}

const WEIGHTS = {
  language: 0.3,
  framework: 0.2,
  difficulty: 0.2,
  history: 0.3,
};

export function calculateMatchScore(issue: IssueProfile, agent: AgentProfile): MatchResult {
  // Language match (30%) — exact match
  const languageScore =
    !issue.language || agent.languages.map((l) => l.toLowerCase()).includes(issue.language.toLowerCase())
      ? 1.0
      : 0.0;

  // Framework match (20%) — intersection ratio
  let frameworkScore = 1.0;
  if (issue.frameworks.length > 0) {
    const agentFw = new Set(agent.frameworks.map((f) => f.toLowerCase()));
    const issueFw = issue.frameworks.map((f) => f.toLowerCase());
    const matched = issueFw.filter((f) => agentFw.has(f)).length;
    frameworkScore = matched / issueFw.length;
  }

  // Difficulty match (20%) — penalty if too hard
  let difficultyScore = 1.0;
  if (issue.difficulty > agent.maxDifficulty) {
    difficultyScore = Math.max(0, 1 - (issue.difficulty - agent.maxDifficulty) * 0.3);
  }

  // History (30%) — success rate
  const historyScore = agent.successRate;

  const totalScore =
    languageScore * WEIGHTS.language +
    frameworkScore * WEIGHTS.framework +
    difficultyScore * WEIGHTS.difficulty +
    historyScore * WEIGHTS.history;

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown: {
      language: languageScore,
      framework: frameworkScore,
      difficulty: difficultyScore,
      history: historyScore,
    },
    eligible: languageScore > 0 && difficultyScore > 0,
  };
}
