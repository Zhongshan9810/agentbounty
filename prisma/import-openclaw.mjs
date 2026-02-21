import "dotenv/config";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const issues = [
  {
    githubUrl: "https://github.com/openclaw/openclaw/issues/22330",
    repo: "openclaw/openclaw",
    issueNumber: 22330,
    title: "Feature: Scheduled Registration Reminders + Calendar Event Creation from UI",
    body: "Feature Request: Scheduled Registration Reminders + Calendar Event Creation from UI. Many gym/fitness apps require advance registration for popular classes. The OpenClaw frontend UI could streamline this flow with direct Google Calendar integration and cron reminder sync.",
    labels: JSON.stringify([]),
    language: "TypeScript",
    frameworks: JSON.stringify(["Node.js"]),
    difficulty: 4,
    issueType: "FEATURE",
    scope: "MULTI_MODULE",
  },
  {
    githubUrl: "https://github.com/openclaw/openclaw/issues/22328",
    repo: "openclaw/openclaw",
    issueNumber: 22328,
    title: "[Feature]: autoThread support for Mattermost",
    body: "The autoThread feature is currently available for Discord but not Mattermost. When enabled, OpenClaw should reply inside a thread of the triggering message rather than posting a new top-level message.",
    labels: JSON.stringify(["enhancement"]),
    language: "TypeScript",
    frameworks: JSON.stringify(["Node.js"]),
    difficulty: 3,
    issueType: "FEATURE",
    scope: "SINGLE_MODULE",
  },
  {
    githubUrl: "https://github.com/openclaw/openclaw/issues/22326",
    repo: "openclaw/openclaw",
    issueNumber: 22326,
    title: "Webchat: support reliable inline image rendering + size controls",
    body: "In OpenClaw webchat, image links often do not render inline in-message, making generated images hard to view in-session. Need reliable inline image previews with optional display constraints.",
    labels: JSON.stringify([]),
    language: "TypeScript",
    frameworks: JSON.stringify(["React", "Node.js"]),
    difficulty: 2,
    issueType: "BUG",
    scope: "SINGLE_MODULE",
  },
  {
    githubUrl: "https://github.com/openclaw/openclaw/issues/22324",
    repo: "openclaw/openclaw",
    issueNumber: 22324,
    title: "[Bug] Telegram reactions broken in v2026.2.19 - REACTION_INVALID error",
    body: "Telegram message reactions fail consistently with REACTION_INVALID error after upgrading from 2026.2.17 to 2026.2.19-2. Downgrading to 2026.2.17 fixes the issue. Likely caused by Telegram channel unification change.",
    labels: JSON.stringify(["bug", "telegram"]),
    language: "TypeScript",
    frameworks: JSON.stringify(["Node.js"]),
    difficulty: 2,
    issueType: "BUG",
    scope: "SINGLE_MODULE",
  },
  {
    githubUrl: "https://github.com/openclaw/openclaw/issues/22323",
    repo: "openclaw/openclaw",
    issueNumber: 22323,
    title: "Add gemini-3.1-pro-preview to built-in Google provider catalog",
    body: "Google released Gemini 3.1 Pro Preview on February 19, 2026. The model is available via the Google AI Studio API under the model ID gemini-3.1-pro-preview, but it's not yet in OpenClaw's built-in google provider catalog.",
    labels: JSON.stringify([]),
    language: "TypeScript",
    frameworks: JSON.stringify(["Node.js"]),
    difficulty: 1,
    issueType: "FEATURE",
    scope: "SINGLE_MODULE",
  },
];

async function main() {
  // Get the poster user
  const poster = await prisma.user.findUnique({ where: { username: "project-maintainer" } });
  if (!poster) throw new Error("Poster user not found. Run seed first.");

  for (const issue of issues) {
    const created = await prisma.issue.create({ data: issue });
    // Create a bounty for each issue
    const amounts = [8000, 5000, 3000, 4000, 1500]; // cents
    const idx = issues.indexOf(issue);
    await prisma.bounty.create({
      data: {
        issueId: created.id,
        posterId: poster.id,
        amountUsd: amounts[idx],
        status: "OPEN",
      },
    });
    console.log(`✅ #${issue.issueNumber}: ${issue.title} ($${amounts[idx] / 100})`);
  }

  console.log("\nDone! 5 OpenClaw issues imported with bounties.");
  await prisma.$disconnect();
}

main().catch(console.error);
