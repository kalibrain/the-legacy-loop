import { InterviewChatMessage, InterviewResourceContext } from "@/types/legacy-loop";

const UM_GPT_BASE_URL = process.env.UM_GPT_BASE_URL!;
const UM_GPT_API_KEY = process.env.UM_GPT_API_KEY!;
const UM_GPT_DEPLOYMENT = process.env.UM_GPT_DEPLOYMENT ?? "gpt-4o";
const UM_GPT_API_VERSION = process.env.UM_GPT_API_VERSION ?? "2024-08-01-preview";
const UM_GPT_ORGANIZATION = process.env.UM_GPT_ORGANIZATION!;

interface UMGPTMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface UMGPTChoice {
  message: { role: string; content: string };
  finish_reason: string;
}

interface UMGPTResponse {
  choices: UMGPTChoice[];
}

export interface InterviewTurn {
  message: string;
  advance: boolean;
  reasoning: string;
}

async function chatCompletion(messages: UMGPTMessage[]): Promise<string> {
  const url = `${UM_GPT_BASE_URL}/openai/deployments/${UM_GPT_DEPLOYMENT}/chat/completions?api-version=${UM_GPT_API_VERSION}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": UM_GPT_API_KEY,
      "Content-Type": "application/json",
      "OpenAI-Organization": UM_GPT_ORGANIZATION,
    },
    body: JSON.stringify({
      messages,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`U-M GPT request failed: ${res.status} — ${body}`);
  }

  const data = (await res.json()) as UMGPTResponse;
  return data.choices[0]?.message?.content ?? "";
}

function buildSystemPrompt(
  currentQuestion: string,
  questionNumber: number,
  totalQuestions: number,
  resourceContext: InterviewResourceContext,
): string {
  const docList = resourceContext.preloadedDocs.map((d) => `- ${d}`).join("\n");
  const sourceList =
    resourceContext.selectedSources.length > 0
      ? resourceContext.selectedSources.map((s) => `- ${s}`).join("\n")
      : "- None selected";

  return `You are an expert knowledge transfer interviewer conducting a structured exit interview at the University of Michigan.

Your goal is to extract critical institutional knowledge from the departing employee so their successor can operate effectively from day one.

Available context:
Preloaded leadership documents:
${docList}

Employee data sources being collected:
${sourceList}

Current interview question (${questionNumber} of ${totalQuestions}):
"${currentQuestion}"

Instructions:
- Respond naturally and conversationally, like a skilled interviewer
- Probe for concrete specifics: tool names, team owners, decision rationale, failure scenarios, thresholds, escalation paths
- After 1-2 substantive exchanges on this question, you may advance to the next topic
- Respond ONLY with valid JSON in exactly this format:
{"message": "your response to the interviewee", "advance": false, "reasoning": "brief internal note on why advancing or not"}

Set "advance" to true when you have enough concrete detail to close this question.`;
}

function parseInterviewTurn(raw: string): InterviewTurn {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<InterviewTurn>;
    if (typeof parsed.message === "string") {
      return {
        message: parsed.message,
        advance: parsed.advance === true,
        reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      };
    }
  } catch {
    // fall through
  }

  // If JSON parse fails, treat the whole response as the message
  return { message: raw.trim(), advance: false, reasoning: "Response was not structured JSON." };
}

export async function generateInterviewResponse(
  sessionMessages: InterviewChatMessage[],
  currentQuestion: string,
  questionNumber: number,
  totalQuestions: number,
  resourceContext: InterviewResourceContext,
): Promise<InterviewTurn> {
  const systemPrompt = buildSystemPrompt(
    currentQuestion,
    questionNumber,
    totalQuestions,
    resourceContext,
  );

  // Map session messages to U-M GPT format (skip the initial assistant question prompt)
  const history: UMGPTMessage[] = sessionMessages
    .filter((m) => m.questionId === sessionMessages.find((x) => x.role === "assistant")?.questionId
      ? true  // keep messages from current question context
      : true)
    .slice(-10) // keep last 10 messages to avoid token overflow
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

  const messages: UMGPTMessage[] = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  const raw = await chatCompletion(messages);
  return parseInterviewTurn(raw);
}
