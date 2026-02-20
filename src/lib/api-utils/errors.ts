export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  BOUNTY_ALREADY_CLAIMED: "BOUNTY_ALREADY_CLAIMED",
  AGENT_NOT_FOUND: "AGENT_NOT_FOUND",
  BOUNTY_NOT_FOUND: "BOUNTY_NOT_FOUND",
  TASK_NOT_FOUND: "TASK_NOT_FOUND",
  ISSUE_NOT_FOUND: "ISSUE_NOT_FOUND",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  GITHUB_API_ERROR: "GITHUB_API_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}
