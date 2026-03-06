"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { useFlowGuard } from "@/hooks/use-flow-guard";

export default function FinishPage() {
  const router = useRouter();
  const { state, actions } = useLegacyLoop();
  const { isHydrated, redirectPath } = useFlowGuard();

  useEffect(() => {
    if (!state.demo.running) return;
    actions.stopDemoRun();
  }, [actions, state.demo.running]);

  if (!isHydrated || redirectPath) {
    return (
      <div className="card-surface rounded-xl p-6 text-brand-500">
        Loading completion screen...
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-4xl rounded-2xl border border-brand-200 bg-white/95 p-10 text-center shadow-soft">
      <h1 className="font-display text-3xl font-bold text-brand-900">Knowledge Capsule Created</h1>
      <p className="mt-3 text-brand-500">
        Thank you. Your responses and collected project context are now available for
        future team members through Legacy Loop.
      </p>

      <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
        <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-400">Questions Answered</p>
          <p className="mt-1 text-2xl font-bold text-brand-900">
            {state.interview.answeredCount}
          </p>
        </div>
        <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-400">Sources Included</p>
          <p className="mt-1 text-2xl font-bold text-brand-900">
            {state.selectedSources.length}
          </p>
        </div>
      </div>

      <div className="mt-8 text-left">
        <h2 className="text-lg font-semibold text-brand-900">Interview Summary</h2>
        {state.interview.summary.length > 0 ? (
          <div className="mt-4 space-y-3">
            {state.interview.summary.map((item) => (
              <details
                key={item.questionId}
                className="rounded-xl border border-brand-100 bg-brand-50/50 p-4"
              >
                <summary className="cursor-pointer text-sm font-semibold text-brand-800">
                  {item.title}
                </summary>
                <div className="mt-3 space-y-3 text-sm text-brand-700">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                      Full Question
                    </p>
                    <p className="mt-1 text-brand-900">{item.question}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                      Answers
                    </p>
                    {item.answers.length > 0 ? (
                      <ul className="mt-1 space-y-2">
                        {item.answers.map((answer, idx) => (
                          <li
                            key={`${item.questionId}-${idx + 1}`}
                            className="rounded-md border border-brand-100 bg-white px-3 py-2"
                          >
                            {answer}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-brand-500">No answer recorded.</p>
                    )}
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-brand-500">No interview summary available.</p>
        )}
      </div>

      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            router.push("/interview?scroll=bottom");
          }}
          aria-label="Go back to interview to provide more context"
          className="rounded-lg border border-brand-300 bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          Back to Interview
        </button>
        <button
          type="button"
          onClick={() => {
            actions.resetDemo();
            router.push("/start");
          }}
          aria-label="Start a new collection from the start screen"
          className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-maize-50 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400"
        >
          Start New Collection
        </button>
      </div>
    </section>
  );
}
