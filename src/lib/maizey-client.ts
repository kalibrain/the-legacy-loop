import { DataSourceId, InterviewResourceContext, SourceConfig } from "@/types/legacy-loop";

const MAIZEY_BASE_URL = process.env.MAIZEY_BASE_URL!;
const MAIZEY_API_KEY = process.env.MAIZEY_API_KEY!;
const MAIZEY_PROJECT_PK = process.env.MAIZEY_PROJECT_PK!;

// Fallback questions if Maizey is unavailable
const FALLBACK_QUESTIONS = [
  "What undocumented workflow did you rely on most to keep this project stable?",
  "Which decision in this system would be easy for a new owner to misinterpret?",
  "Where did you implement workarounds instead of long-term fixes?",
  "What vendor relationships, SLA quirks, or external dependencies does a new owner need to know about?",
  "Who are the key contacts outside your immediate team that a successor must build a relationship with?",
];

interface MaizeyConversation {
  pk: number;
  project_id: string;
  user_id: number;
  title: string;
  meta: string;
  created: string;
}

interface MaizeyMessage {
  id: number;
  conversation_id: number;
  query: string;
  response: string;
  sources: unknown;
  created: string;
}

function maizeyHeaders() {
  return {
    Authorization: `Bearer ${MAIZEY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function createConversation(): Promise<MaizeyConversation> {
  const res = await fetch(
    `${MAIZEY_BASE_URL}/maizey/api/projects/${MAIZEY_PROJECT_PK}/conversation/`,
    {
      method: "POST",
      headers: maizeyHeaders(),
      body: JSON.stringify({}),
    },
  );

  if (!res.ok) {
    throw new Error(`Maizey create conversation failed: ${res.status}`);
  }

  return res.json() as Promise<MaizeyConversation>;
}

async function sendQuery(conversationPk: number, query: string): Promise<MaizeyMessage> {
  const res = await fetch(
    `${MAIZEY_BASE_URL}/maizey/api/projects/${MAIZEY_PROJECT_PK}/conversation/${conversationPk}/messages/`,
    {
      method: "POST",
      headers: maizeyHeaders(),
      body: JSON.stringify({ query }),
    },
  );

  if (!res.ok) {
    throw new Error(`Maizey send query failed: ${res.status}`);
  }

  return res.json() as Promise<MaizeyMessage>;
}

function buildSourceSummary(
  selectedSources: DataSourceId[],
  sourceDetails: Partial<Record<DataSourceId, SourceConfig>>,
): string {
  if (selectedSources.length === 0) return "No specific data sources selected.";

  return selectedSources
    .map((id) => {
      const detail = sourceDetails[id];
      if (!detail) return `- ${id}`;

      if (detail.type === "github" || detail.type === "gitlab" || detail.type === "jira") {
        return `- ${id}: ${detail.repoLink}`;
      }
      if (detail.type === "slack" || detail.type === "microsoft-teams") {
        const channels = detail.channels.filter((c) => c.selected).map((c) => c.name);
        return `- ${id}: ${channels.length > 0 ? channels.join(", ") : "no channels selected"}`;
      }
      if (detail.type === "google-drive") {
        return detail.mode === "link"
          ? `- google-drive: ${detail.link}`
          : `- google-drive: ${detail.files.length} uploaded file(s)`;
      }
      if (detail.type === "other") {
        return `- other: ${detail.files.length} uploaded file(s)`;
      }
      return `- ${id}`;
    })
    .join("\n");
}

function parseQuestionsFromResponse(response: string): string[] {
  // Try JSON array first
  const jsonMatch = response.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as unknown;
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.every((q) => typeof q === "string")
      ) {
        return parsed as string[];
      }
    } catch {
      // fall through to line parsing
    }
  }

  // Fall back to numbered lines: "1. Question?" or "1) Question?"
  const lines = response
    .split("\n")
    .map((l) => l.replace(/^\d+[.)]\s*/, "").trim())
    .filter((l) => l.length > 10 && l.includes("?"));

  return lines.length >= 3 ? lines : [];
}

export async function generateInterviewQuestions(
  resourceContext: InterviewResourceContext,
): Promise<string[]> {
  try {
    const sourceSummary = buildSourceSummary(
      resourceContext.selectedSources,
      resourceContext.sourceDetails,
    );

    const query = `You are a knowledge retention specialist helping capture institutional knowledge from a departing employee.

Preloaded leadership documents on file:
${resourceContext.preloadedDocs.map((d) => `- ${d}`).join("\n")}

Employee data sources being collected:
${sourceSummary}

Generate exactly 5 targeted exit interview questions that will uncover:
1. Undocumented workflows and tribal knowledge
2. Key system or business decisions and their rationale
3. Known workarounds and technical debt
4. Critical vendor/tool relationships and dependencies
5. Escalation paths and key contacts a successor must know

Return ONLY a valid JSON array of exactly 5 question strings. No preamble, no explanation.
Format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

    const conversation = await createConversation();
    const message = await sendQuery(conversation.pk, query);
    const questions = parseQuestionsFromResponse(message.response);

    if (questions.length >= 3) {
      return questions.slice(0, 5);
    }

    return FALLBACK_QUESTIONS;
  } catch (err) {
    console.error("[Maizey] Failed to generate questions, using fallback:", err);
    return FALLBACK_QUESTIONS;
  }
}
