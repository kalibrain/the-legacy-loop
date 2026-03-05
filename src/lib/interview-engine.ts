import crypto from "node:crypto";
import { buildInterviewCitations } from "@/lib/interview-citations";
import {
  InterviewChatMessage,
  InterviewChatRequest,
  InterviewChatResponse,
  InterviewChatSessionState,
  InterviewQuestion,
  InterviewStartRequest,
  InterviewStartResponse,
} from "@/types/legacy-loop";

const BASE_QUESTION_TEXT: string[] = [
  "What undocumented workflow did you rely on most to keep this project stable?",
  "Which decision in this system would be easy for a new owner to misinterpret?",
  "Where did you implement workarounds instead of long-term fixes?",
];

const SIGNAL_TERMS = [
  "workflow",
  "decision",
  "workaround",
  "vendor",
  "timeout",
  "manual",
  "incident",
  "retry",
  "escalation",
  "monitor",
];

const CONCRETE_INDICATOR_REGEX =
  /(\d+|owner|team|dashboard|log|metric|slack|jira|github|gitlab|runbook|api|on-call|ticket)/i;

const MIN_FOLLOW_UPS_PER_QUESTION = 2;
const MAX_FOLLOW_UPS_PER_QUESTION = 2;

class InterviewEngineError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type GlobalWithInterviewSessions = typeof globalThis & {
  __legacyLoopInterviewSessions?: Map<string, InterviewChatSessionState>;
};

const globalForInterview = globalThis as GlobalWithInterviewSessions;
const sessions =
  globalForInterview.__legacyLoopInterviewSessions ??
  new Map<string, InterviewChatSessionState>();

if (!globalForInterview.__legacyLoopInterviewSessions) {
  globalForInterview.__legacyLoopInterviewSessions = sessions;
}

function buildQuestions(): InterviewQuestion[] {
  return BASE_QUESTION_TEXT.map((text, index) => ({
    id: `base-${index + 1}`,
    text,
    depth: 0 as const,
  }));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countSignals(text: string): number {
  const lower = text.toLowerCase();
  return SIGNAL_TERMS.filter((term) => lower.includes(term)).length;
}

function isDetailedEnough(answer: string): boolean {
  if (countWords(answer) >= 45) return true;
  if (countSignals(answer) >= 2 && CONCRETE_INDICATOR_REGEX.test(answer)) return true;
  return false;
}

function shouldAdvanceQuestion(answer: string, followUpCount: number): boolean {
  if (followUpCount < MIN_FOLLOW_UPS_PER_QUESTION) {
    return false;
  }

  if (followUpCount >= MAX_FOLLOW_UPS_PER_QUESTION) {
    return true;
  }

  return isDetailedEnough(answer);
}

function buildFollowUpPrompt(
  question: InterviewQuestion,
  answer: string,
  followUpRound: number,
): string {
  const lower = answer.toLowerCase();

  if (lower.includes("vendor")) {
    return "Thanks. Can you add a concrete incident example with the first signal you checked and what action you took?";
  }
  if (lower.includes("timeout")) {
    return "Helpful context. Which dashboard/log did you check first, and what threshold triggered manual intervention?";
  }
  if (lower.includes("manual")) {
    return "Please break that manual process into ordered steps and note the most common failure point.";
  }
  if (lower.includes("workaround")) {
    return "What exact condition triggered the workaround, and who should own replacing it with a long-term fix?";
  }

  if (followUpRound === 1) {
    return `Please add a concrete example for this topic, including tooling, owner, and the exact decision path you used.`;
  }

  if (followUpRound === 2) {
    return `To close this topic, include the trigger signal, your response steps, and what a new owner should watch for first.`;
  }

  return `Final detail check for "${question.text}": summarize the trigger, action, and expected outcome.`;
}

function makeMessage(
  role: InterviewChatMessage["role"],
  content: string,
  questionId: string,
  questionNumber: number,
  options?: {
    reasoningSummary?: string;
    citations?: InterviewChatMessage["citations"];
  },
): InterviewChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
    questionId,
    questionNumber,
    reasoningSummary: options?.reasoningSummary,
    citations: options?.citations,
  };
}

function makeQuestionPrompt(question: InterviewQuestion, questionNumber: number, total: number): string {
  return `Question ${questionNumber} of ${total}: ${question.text}`;
}

export function startInterviewSession(input: InterviewStartRequest): InterviewStartResponse {
  if (!input?.resourceContext) {
    throw new InterviewEngineError("resourceContext is required.", 400);
  }

  const sessionId = crypto.randomUUID();
  const questions = buildQuestions();
  const firstQuestion = questions[0];

  const initialAssistantMessage = makeMessage(
    "assistant",
    makeQuestionPrompt(firstQuestion, 1, questions.length),
    firstQuestion.id,
    1,
    {
      reasoningSummary:
        "Starting with foundational context to capture undocumented workflows and ownership details.",
      citations: buildInterviewCitations(input.resourceContext, firstQuestion.text, ""),
    },
  );

  const session: InterviewChatSessionState = {
    sessionId,
    questions: questions.map((question) => ({ id: question.id, text: question.text })),
    currentQuestionIndex: 0,
    completedQuestionIds: [],
    messages: [initialAssistantMessage],
    resourceContext: input.resourceContext,
    followUpCountByQuestion: {},
    done: false,
  };

  sessions.set(sessionId, session);

  return {
    sessionId,
    messages: [initialAssistantMessage],
    currentQuestionId: firstQuestion.id,
    currentQuestionNumber: 1,
    totalQuestions: questions.length,
    done: false,
  };
}

export function answerInterviewMessage(input: InterviewChatRequest): InterviewChatResponse {
  const session = sessions.get(input.sessionId);
  if (!session) {
    throw new InterviewEngineError("Session not found. Restart interview.", 404);
  }

  if (session.done) {
    return {
      messages: [],
      completedCount: session.completedQuestionIds.length,
      totalQuestions: session.questions.length,
      done: true,
    };
  }

  const userText = input.message?.trim();
  if (!userText) {
    throw new InterviewEngineError("Message is required.", 400);
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  if (!currentQuestion) {
    session.done = true;
    return {
      messages: [],
      completedCount: session.completedQuestionIds.length,
      totalQuestions: session.questions.length,
      done: true,
    };
  }

  const questionNumber = session.currentQuestionIndex + 1;
  const userMessage = makeMessage(
    "user",
    userText,
    currentQuestion.id,
    questionNumber,
  );
  session.messages.push(userMessage);

  const followUpCount = session.followUpCountByQuestion[currentQuestion.id] ?? 0;
  const detailedEnough = shouldAdvanceQuestion(userText, followUpCount);

  if (!detailedEnough) {
    const nextFollowUpCount = followUpCount + 1;
    session.followUpCountByQuestion[currentQuestion.id] = nextFollowUpCount;

    const assistantMessage = makeMessage(
      "assistant",
      buildFollowUpPrompt(
        {
          id: currentQuestion.id,
          text: currentQuestion.text,
          depth: 0,
        },
        userText,
        nextFollowUpCount,
      ),
      currentQuestion.id,
      questionNumber,
      {
        reasoningSummary:
          "I’m continuing this topic to capture concrete handoff details before moving to the next area.",
        citations: buildInterviewCitations(
          session.resourceContext,
          currentQuestion.text,
          userText,
        ),
      },
    );

    session.messages.push(assistantMessage);

    return {
      messages: [userMessage, assistantMessage],
      currentQuestionId: currentQuestion.id,
      currentQuestionNumber: questionNumber,
      completedCount: session.completedQuestionIds.length,
      totalQuestions: session.questions.length,
      done: false,
    };
  }

  if (!session.completedQuestionIds.includes(currentQuestion.id)) {
    session.completedQuestionIds.push(currentQuestion.id);
  }

  const nextQuestionIndex = session.currentQuestionIndex + 1;
  const hasMoreQuestions = nextQuestionIndex < session.questions.length;

  if (!hasMoreQuestions) {
    session.done = true;
    const assistantMessage = makeMessage(
      "assistant",
      "Thanks for the detailed responses. This completes the interview, and your knowledge capsule is now ready for handoff.",
      currentQuestion.id,
      questionNumber,
      {
        reasoningSummary:
          "All core interview topics have enough detail for transfer readiness.",
        citations: buildInterviewCitations(
          session.resourceContext,
          currentQuestion.text,
          userText,
        ),
      },
    );
    session.messages.push(assistantMessage);

    return {
      messages: [userMessage, assistantMessage],
      completedCount: session.completedQuestionIds.length,
      totalQuestions: session.questions.length,
      done: true,
    };
  }

  session.currentQuestionIndex = nextQuestionIndex;
  const nextQuestion = session.questions[nextQuestionIndex];
  const assistantMessage = makeMessage(
    "assistant",
    `Thanks, that level of detail is helpful. ${makeQuestionPrompt(
      {
        id: nextQuestion.id,
        text: nextQuestion.text,
        depth: 0,
      },
      nextQuestionIndex + 1,
      session.questions.length,
    )}`,
    nextQuestion.id,
    nextQuestionIndex + 1,
    {
      reasoningSummary:
        "Your response was specific enough to close the previous topic, so I moved to the next transfer area.",
      citations: buildInterviewCitations(
        session.resourceContext,
        nextQuestion.text,
        userText,
      ),
    },
  );
  session.messages.push(assistantMessage);

  return {
    messages: [userMessage, assistantMessage],
    currentQuestionId: nextQuestion.id,
    currentQuestionNumber: nextQuestionIndex + 1,
    completedCount: session.completedQuestionIds.length,
    totalQuestions: session.questions.length,
    done: false,
  };
}

export { InterviewEngineError };
