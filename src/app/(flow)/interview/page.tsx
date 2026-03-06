"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { useFlowGuard } from "@/hooks/use-flow-guard";
import { PRELOADED_INTERVIEW_DOCUMENTS } from "@/lib/constants";
import { getDemoAnswerSequence } from "@/lib/demo-mode";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai/reasoning";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai/sources";
import {
  InterviewChatMessage,
  InterviewChatResponse,
  InterviewSessionSnapshotResponse,
  InterviewSummaryItem,
  InterviewStartRequest,
  InterviewStartResponse,
} from "@/types/legacy-loop";

type PromptStatus = "submitted" | "streaming" | "ready" | "error";

function extractQuestionText(content: string): string {
  const pattern = /Question\s+\d+\s+of\s+\d+:\s*([\s\S]*)/gi;
  let extracted: string | null = null;
  let match = pattern.exec(content);
  while (match) {
    extracted = match[1].trim();
    match = pattern.exec(content);
  }

  return extracted ?? content.trim();
}

function buildQuestionTitle(question: string, questionNumber: number): string {
  const compact = question.replace(/\s+/g, " ").trim();
  if (!compact) return `Question ${questionNumber}`;
  const words = compact.split(" ");
  const snippet = words.slice(0, 7).join(" ");
  return words.length > 7
    ? `Q${questionNumber}: ${snippet}...`
    : `Q${questionNumber}: ${snippet}`;
}

function buildInterviewSummary(messages: InterviewChatMessage[]): InterviewSummaryItem[] {
  const questions = new Map<string, { text: string; number: number }>();
  const answers = new Map<string, string[]>();

  for (const message of messages) {
    if (message.role === "assistant" && !questions.has(message.questionId)) {
      questions.set(message.questionId, {
        text: extractQuestionText(message.content),
        number: message.questionNumber,
      });
    }

    if (message.role === "user") {
      const existing = answers.get(message.questionId) ?? [];
      answers.set(message.questionId, [...existing, message.content.trim()]);
    }
  }

  return [...questions.entries()]
    .sort((a, b) => a[1].number - b[1].number)
    .map(([questionId, meta]) => ({
      questionId,
      questionNumber: meta.number,
      title: buildQuestionTitle(meta.text, meta.number),
      question: meta.text,
      answers: answers.get(questionId) ?? [],
    }));
}

export default function InterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, actions } = useLegacyLoop();
  const { isHydrated, redirectPath } = useFlowGuard();
  const demoRunning = state.demo.running;
  const demoProfile = state.demo.profile;
  const shouldScrollToBottom = searchParams.get("scroll") === "bottom";
  const demoAnswers = useMemo(
    () => getDemoAnswerSequence(demoProfile),
    [demoProfile],
  );

  const [sessionId, setSessionId] = useState<string | undefined>(state.interview.sessionId);
  const [messages, setMessages] = useState<InterviewChatMessage[]>([]);
  const [status, setStatus] = useState<PromptStatus>("ready");
  const [loadingStart, setLoadingStart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [readyToFinish, setReadyToFinish] = useState(false);
  const [progress, setProgress] = useState({
    completedCount: state.interview.answeredCount,
    totalQuestions: state.interview.totalQuestions,
    currentQuestionNumber:
      state.interview.answeredCount + 1 > 0
        ? state.interview.answeredCount + 1
        : 1,
  });

  const conversationRef = useRef<HTMLDivElement | null>(null);
  const interviewBottomRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedReturnScrollRef = useRef(false);

  useEffect(() => {
    if (!conversationRef.current) return;
    conversationRef.current.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (!shouldScrollToBottom) {
      hasAppliedReturnScrollRef.current = false;
      return;
    }

    if (hasAppliedReturnScrollRef.current || loadingStart || messages.length === 0) {
      return;
    }

    hasAppliedReturnScrollRef.current = true;

    const scrollToInterviewBottom = () => {
      interviewBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      conversationRef.current?.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: "smooth",
      });
    };

    scrollToInterviewBottom();
    const timer = window.setTimeout(scrollToInterviewBottom, 140);
    return () => window.clearTimeout(timer);
  }, [loadingStart, messages.length, shouldScrollToBottom]);

  const bootstrapInterview = useCallback(async (): Promise<InterviewStartResponse | null> => {
    setLoadingStart(true);
    setError(null);
    setStatus("ready");
    setReadyToFinish(false);

    try {
      const payload: InterviewStartRequest = {
        resourceContext: {
          preloadedDocs: PRELOADED_INTERVIEW_DOCUMENTS,
          selectedSources: state.selectedSources,
          sourceDetails: state.sourceDetails,
        },
        demoMode: demoRunning
          ? {
              enabled: true,
              profile: demoProfile,
            }
          : undefined,
      };

      let data: InterviewStartResponse | null = null;
      let lastError: Error | null = null;
      const maxAttempts = demoRunning ? 2 : 1;
      const body = JSON.stringify(payload);

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const response = await fetch("/api/interview/start", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body,
          });

          if (!response.ok) {
            throw new Error("Failed to initialize interview session.");
          }

          data = (await response.json()) as InterviewStartResponse;
          break;
        } catch (attemptError) {
          lastError =
            attemptError instanceof Error
              ? attemptError
              : new Error("Unable to start interview.");
        }
      }

      if (!data) {
        throw (lastError ?? new Error("Failed to initialize interview session."));
      }

      setSessionId(data.sessionId);
      setMessages(data.messages);
      actions.setInterviewSummary(buildInterviewSummary(data.messages));
      setProgress({
        completedCount: 0,
        totalQuestions: data.totalQuestions,
        currentQuestionNumber: data.currentQuestionNumber,
      });

      actions.initializeInterview(data.sessionId, data.totalQuestions);
      actions.setInterviewProgress(0, data.totalQuestions);
      return data;
    } catch (startError) {
      if (demoRunning) {
        actions.stopDemoRun(
          "Demo interview initialization failed after one retry. Restart manually.",
        );
      }
      setStatus("error");
      setError(
        startError instanceof Error
          ? startError.message
          : "Unable to start interview. Retry below.",
      );
      return null;
    } finally {
      setLoadingStart(false);
    }
  }, [
    actions,
    demoProfile,
    demoRunning,
    state.selectedSources,
    state.sourceDetails,
  ]);

  const resumeInterview = useCallback(async (): Promise<InterviewSessionSnapshotResponse | null> => {
    if (!sessionId) return null;

    setLoadingStart(true);
    setError(null);
    setStatus("ready");

    try {
      const response = await fetch(
        `/api/interview/session?sessionId=${encodeURIComponent(sessionId)}`,
        {
          method: "GET",
        },
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error ?? "Failed to restore interview session.");
      }

      const data = (await response.json()) as InterviewSessionSnapshotResponse;
      setSessionId(data.sessionId);
      setMessages(data.messages);
      actions.setInterviewSummary(buildInterviewSummary(data.messages));
      setProgress({
        completedCount: data.completedCount,
        totalQuestions: data.totalQuestions,
        currentQuestionNumber: data.currentQuestionNumber,
      });
      setReadyToFinish(data.done);
      return data;
    } catch (restoreError) {
      setStatus("error");
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Unable to restore interview session.",
      );
      return null;
    } finally {
      setLoadingStart(false);
    }
  }, [actions, sessionId]);

  useEffect(() => {
    if (!isHydrated || redirectPath || loadingStart || messages.length > 0) {
      return;
    }

    const initializeInterviewSession = async () => {
      if (sessionId) {
        const resumed = await resumeInterview();
        if (resumed) return;
      }

      await bootstrapInterview();
    };

    void initializeInterviewSession();
  }, [
    bootstrapInterview,
    isHydrated,
    loadingStart,
    messages.length,
    redirectPath,
    resumeInterview,
    sessionId,
  ]);

  const submitMessage = useCallback(async (inputText: string): Promise<boolean> => {
    const trimmed = inputText.trim();
    if (!trimmed || !sessionId || status === "streaming") return false;

    const lastAssistant = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    const questionId = lastAssistant?.questionId ?? `q-${progress.currentQuestionNumber}`;

    const optimisticUserMessage: InterviewChatMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
      questionId,
      questionNumber: progress.currentQuestionNumber,
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setStatus("streaming");
    setError(null);

    try {
      let activeSessionId = sessionId;
      let response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: activeSessionId,
          message: trimmed,
        }),
      });

      if (response.status === 404) {
        actions.clearInterview();
        const restarted = await bootstrapInterview();
        if (!restarted) {
          throw new Error("Session not found. Restart interview.");
        }

        activeSessionId = restarted.sessionId;
        setSessionId(activeSessionId);
        response = await fetch("/api/interview/answer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: activeSessionId,
            message: trimmed,
          }),
        });
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody.error ?? "Could not send message. Please retry.");
      }

      const payload = (await response.json()) as InterviewChatResponse;
      const nextMessages = [
        ...messages.filter((message) => message.id !== optimisticUserMessage.id),
        ...payload.messages,
      ];
      setMessages(nextMessages);
      actions.setInterviewSummary(buildInterviewSummary(nextMessages));

      const currentQuestionNumber =
        payload.currentQuestionNumber ??
        Math.min(payload.completedCount + 1, payload.totalQuestions || 1);
      setProgress({
        completedCount: payload.completedCount,
        totalQuestions: payload.totalQuestions,
        currentQuestionNumber,
      });

      if (payload.done) {
        actions.setInterviewProgress(payload.completedCount, payload.totalQuestions);
        setReadyToFinish(true);
        setDraftText("");
        setStatus("ready");
        return true;
      }

      setReadyToFinish(false);
      actions.setInterviewProgress(payload.completedCount, payload.totalQuestions);
      setStatus("ready");
      return true;
    } catch (submitError) {
      setStatus("error");
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit message.";
      setError(message);

      setMessages((prev) =>
        prev.filter((message) => message.id !== optimisticUserMessage.id),
      );
      return false;
    }
  }, [
    actions,
    bootstrapInterview,
    messages,
    progress.currentQuestionNumber,
    sessionId,
    status,
  ]);

  const loadScriptedAnswer = useCallback(() => {
    if (readyToFinish) return;
    const questionIndex = progress.currentQuestionNumber - 1;
    const scripted = demoAnswers[questionIndex];
    if (!scripted) {
      setError("No scripted answer is configured for this question.");
      return;
    }
    setError(null);
    setDraftText(scripted);
  }, [demoAnswers, progress.currentQuestionNumber, readyToFinish]);

  const finishInterview = useCallback(() => {
    actions.completeInterview(progress.completedCount, progress.totalQuestions);
    if (demoRunning) {
      actions.stopDemoRun();
    }
    router.push("/finish");
  }, [
    actions,
    demoRunning,
    progress.completedCount,
    progress.totalQuestions,
    router,
  ]);

  const statusLabel = useMemo(() => {
    if (loadingStart) return "Preparing interview...";
    if (readyToFinish) return "Interview Complete";
    return `Question ${progress.currentQuestionNumber} of ${Math.max(
      progress.totalQuestions,
      1,
    )}`;
  }, [loadingStart, progress.currentQuestionNumber, progress.totalQuestions, readyToFinish]);

  if (!isHydrated || redirectPath) {
    return (
      <div className="card-surface rounded-xl p-6 text-brand-500">
        Loading interview state...
      </div>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <header>
          <h1 className="font-display text-3xl font-bold text-brand-900">Exit Interview</h1>
          <p className="mt-2 text-brand-500">
            Questions are based on documents provided by your manager/supervisor
            and the sources collected in this session. Keep responses concrete;
            the assistant will continue guided follow-ups (up to 2 follow-up prompts per topic)
            until enough detail is captured.
          </p>
        </header>

        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-900">
            Preloaded Leadership Documents Included ({PRELOADED_INTERVIEW_DOCUMENTS.length})
          </p>
          <p className="mt-1 text-sm text-brand-800">
            These are combined with your selected source data to generate and
            refine interview prompts.
          </p>
          {demoRunning ? (
            <p className="mt-2 rounded-md border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700">
              Demo mode is active. Scripted fallback Q/A is driving this interview.
            </p>
          ) : null}
        </div>

        <div className="relative">
          <Conversation id="interview-conversation" ref={conversationRef} className="h-[520px]">
            <ConversationContent>
              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <div className="max-w-[88%]">
                    {message.role === "assistant" && message.citations?.length ? (
                      <Sources>
                        <SourcesTrigger count={message.citations.length} />
                        <SourcesContent>
                          {message.citations.map((citation) => (
                            <Source
                              key={citation.id}
                              title={citation.title}
                              type={citation.type}
                            />
                          ))}
                        </SourcesContent>
                      </Sources>
                    ) : null}

                    {message.role === "assistant" && message.reasoningSummary ? (
                      <Reasoning>
                        <ReasoningTrigger />
                        <ReasoningContent>{message.reasoningSummary}</ReasoningContent>
                      </Reasoning>
                    ) : null}

                    <MessageContent from={message.role} className="mt-2">
                      <MessageResponse>{message.content}</MessageResponse>
                    </MessageContent>
                  </div>
                </Message>
              ))}

              {loadingStart ? (
                <Message from="assistant">
                  <MessageContent from="assistant">
                    <MessageResponse>
                      Preparing your interview session and first question...
                    </MessageResponse>
                  </MessageContent>
                </Message>
              ) : null}

              {status === "streaming" ? (
                <Message from="assistant">
                  <MessageContent from="assistant">
                    <MessageResponse>
                      <span className="inline-flex items-center gap-1 text-brand-500">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-maize-500" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-maize-500 [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-maize-500 [animation-delay:240ms]" />
                        <span className="ml-2">Assistant is reviewing your response...</span>
                      </span>
                    </MessageResponse>
                  </MessageContent>
                </Message>
              ) : null}

            </ConversationContent>
          </Conversation>
        </div>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <PromptInput
          status={status}
          value={draftText}
          onValueChange={setDraftText}
          onSubmit={({ text }) => submitMessage(text)}
        >
          <PromptInputBody>
            <PromptInputTextarea
              rows={3}
              placeholder={
                demoRunning
                  ? "Press 'Demo Answer', then Answer."
                  : "Share detailed context, decision logic, and concrete examples..."
              }
            />
          </PromptInputBody>
          <PromptInputFooter className="w-full">
            <div className="flex w-full items-center">
              <div className="min-w-[110px]">
                {demoRunning ? (
                  <button
                    type="button"
                    onClick={loadScriptedAnswer}
                    disabled={loadingStart || status === "streaming" || readyToFinish}
                    className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Demo Answer
                  </button>
                ) : null}
              </div>
              <div className="flex flex-1 justify-center">
                <PromptInputSubmit
                  status={status}
                  label="Answer"
                />
              </div>
              <div className="min-w-[110px] text-right">
                <button
                  type="button"
                  onClick={finishInterview}
                  className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-maize-50 transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400"
                >
                  Finish
                </button>
              </div>
            </div>
          </PromptInputFooter>
        </PromptInput>
        <div ref={interviewBottomRef} aria-hidden="true" />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="card-surface rounded-xl border-brand-200 bg-white/95 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
            Interview Progress
          </p>
          <p className="mt-2 font-display text-xl font-bold text-brand-900">{statusLabel}</p>
          <div className="mt-4 space-y-2 text-sm text-brand-700">
            <p>
              Completed Questions:{" "}
              <span className="font-semibold text-brand-900">
                {progress.completedCount}
              </span>
            </p>
            <p>
              Total Questions:{" "}
              <span className="font-semibold text-brand-900">
                {Math.max(progress.totalQuestions, 1)}
              </span>
            </p>
            <p className="text-xs text-brand-500">
              {demoRunning
                ? "Press 'Demo Answer' for each question, then click Answer."
                : readyToFinish
                ? "All questions are answered. Add more context with Answer, or click Finish any time."
                : status === "streaming"
                ? "Assistant is analyzing your last message..."
                : "Each topic will include up to 2 guided follow-up prompts before moving forward."}
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
