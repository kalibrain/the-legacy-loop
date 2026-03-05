"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { useFlowGuard } from "@/hooks/use-flow-guard";
import { PRELOADED_INTERVIEW_DOCUMENTS } from "@/lib/constants";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
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
  InterviewStartRequest,
  InterviewStartResponse,
} from "@/types/legacy-loop";

type PromptStatus = "submitted" | "streaming" | "ready" | "error";

export default function InterviewPage() {
  const router = useRouter();
  const { state, actions } = useLegacyLoop();
  const { isHydrated, redirectPath } = useFlowGuard();

  const [sessionId, setSessionId] = useState<string | undefined>(state.interview.sessionId);
  const [messages, setMessages] = useState<InterviewChatMessage[]>([]);
  const [status, setStatus] = useState<PromptStatus>("ready");
  const [loadingStart, setLoadingStart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({
    completedCount: state.interview.answeredCount,
    totalQuestions: state.interview.totalQuestions,
    currentQuestionNumber:
      state.interview.answeredCount + 1 > 0
        ? state.interview.answeredCount + 1
        : 1,
  });

  const conversationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!conversationRef.current) return;
    conversationRef.current.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const bootstrapInterview = useCallback(async (): Promise<InterviewStartResponse | null> => {
    setLoadingStart(true);
    setError(null);
    setStatus("ready");

    try {
      const payload: InterviewStartRequest = {
        resourceContext: {
          preloadedDocs: PRELOADED_INTERVIEW_DOCUMENTS,
          selectedSources: state.selectedSources,
          sourceDetails: state.sourceDetails,
        },
      };

      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize interview session.");
      }

      const data = (await response.json()) as InterviewStartResponse;
      setSessionId(data.sessionId);
      setMessages(data.messages);
      setProgress({
        completedCount: 0,
        totalQuestions: data.totalQuestions,
        currentQuestionNumber: data.currentQuestionNumber,
      });

      actions.initializeInterview(data.sessionId, data.totalQuestions);
      actions.setInterviewProgress(0, data.totalQuestions);
      return data;
    } catch (startError) {
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
  }, [actions, state.selectedSources, state.sourceDetails]);

  useEffect(() => {
    if (!isHydrated || redirectPath) return;
    if (state.interview.done) {
      router.replace("/finish");
      return;
    }

    if (!sessionId || messages.length === 0) {
      void bootstrapInterview();
    }
  }, [
    bootstrapInterview,
    isHydrated,
    messages.length,
    redirectPath,
    router,
    sessionId,
    state.interview.done,
  ]);

  const handleSubmit = async (inputText: string) => {
    const trimmed = inputText.trim();
    if (!trimmed || !sessionId || status === "streaming") return;

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
        throw new Error("Could not send message. Please retry.");
      }

      const payload = (await response.json()) as InterviewChatResponse;
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== optimisticUserMessage.id),
        ...payload.messages,
      ]);

      const currentQuestionNumber =
        payload.currentQuestionNumber ??
        Math.min(payload.completedCount + 1, payload.totalQuestions || 1);
      setProgress({
        completedCount: payload.completedCount,
        totalQuestions: payload.totalQuestions,
        currentQuestionNumber,
      });

      if (payload.done) {
        actions.completeInterview(payload.completedCount, payload.totalQuestions);
        setStatus("ready");
        router.push("/finish");
        return;
      }

      actions.setInterviewProgress(payload.completedCount, payload.totalQuestions);
      setStatus("ready");
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
    }
  };

  const statusLabel = useMemo(() => {
    if (loadingStart) return "Preparing interview...";
    return `Question ${progress.currentQuestionNumber} of ${Math.max(
      progress.totalQuestions,
      1,
    )}`;
  }, [loadingStart, progress.currentQuestionNumber, progress.totalQuestions]);

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

        <PromptInput status={status} onSubmit={({ text }) => void handleSubmit(text)}>
          <PromptInputBody>
            <PromptInputTextarea
              rows={3}
              placeholder="Share detailed context, decision logic, and concrete examples..."
            />
          </PromptInputBody>
          <PromptInputFooter className="justify-between">
            <ConversationScrollButton />
            <PromptInputSubmit
              status={status}
              disabled={loadingStart || status === "streaming"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>

      <aside className="space-y-4">
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
              {status === "streaming"
                ? "Assistant is analyzing your last message..."
                : "Each topic will include up to 2 guided follow-up prompts before moving forward."}
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
