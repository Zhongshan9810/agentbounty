import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export function parseGitHubUrl(url: string) {
  const match = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)\/(issues|pull)\/(\d+)/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: match[1], repo: match[2], type: match[3], number: parseInt(match[4]) };
}

export async function searchIssues(query: string, perPage = 20) {
  const res = await octokit.rest.search.issuesAndPullRequests({
    q: query,
    per_page: perPage,
    sort: "updated",
    order: "desc",
  });
  return res.data;
}

export async function getIssue(owner: string, repo: string, issueNumber: number) {
  const res = await octokit.rest.issues.get({ owner, repo, issue_number: issueNumber });
  return res.data;
}

export async function getRepoInfo(owner: string, repo: string) {
  const res = await octokit.rest.repos.get({ owner, repo });
  return res.data;
}

export async function getPullRequest(owner: string, repo: string, pullNumber: number) {
  const res = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
  return res.data;
}

export async function getCheckRuns(owner: string, repo: string, ref: string) {
  const res = await octokit.rest.checks.listForRef({ owner, repo, ref });
  return res.data;
}

export async function getRepoLanguages(owner: string, repo: string) {
  const res = await octokit.rest.repos.listLanguages({ owner, repo });
  return res.data;
}

export async function getRepoContents(owner: string, repo: string, path: string) {
  try {
    const res = await octokit.rest.repos.getContent({ owner, repo, path });
    return res.data;
  } catch {
    return null;
  }
}
