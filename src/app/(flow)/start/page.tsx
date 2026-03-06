"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { PRELOADED_INTERVIEW_DOCUMENTS } from "@/lib/constants";

export default function StartPage() {
  const router = useRouter();
  const { state, actions } = useLegacyLoop();
  const resetOnMountRef = useRef(false);

  useEffect(() => {
    if (resetOnMountRef.current) return;
    resetOnMountRef.current = true;
    actions.resetDemoControls();
  }, [actions]);

  const handleStart = () => {
    actions.resetDemo();
    router.push("/collect");
  };

  const handleRunDemo = () => {
    const selectedProfile = state.demo.profile;
    actions.resetDemo();
    actions.setDemoEnabled(true);
    actions.setDemoProfile(selectedProfile);
    actions.startDemoRun();
    router.push("/collect");
  };

  return (
    <section className="animate-hero-enter mx-auto max-w-4xl rounded-2xl border border-brand-200 bg-white/95 p-8 shadow-soft md:p-10">
      <span className="inline-flex rounded-full border border-brand-200 bg-maize-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
        U-M Knowledge Retention
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-brand-900 md:text-4xl">
        Knowledge Retention for Employee Offboarding
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-brand-500">
        Capture undocumented workflows, decisions, and troubleshooting playbooks
        before knowledge walks out the door.
      </p>

      <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
        This interview was initiated by your manager, supervisor, or HR partner.
        They may have already uploaded supporting documents that will help guide
        question generation.
      </div>

      <div className="mt-5 grid gap-4 rounded-xl border border-brand-100 bg-brand-50/60 p-5 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Preloaded By Leadership
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-brand-700">
            {PRELOADED_INTERVIEW_DOCUMENTS.map((document) => (
              <li key={document}>• {document}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            How Questions Are Built
          </h2>
          <p className="mt-2 text-sm text-brand-700">
            Interview questions are generated from supervisor-uploaded documents
            plus the sources and files collected during this flow. Your answers
            will further refine follow-up questions.
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleStart}
          aria-label="Start exit interview flow"
          className="rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-maize-50 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400"
        >
          Start Exit Interview
        </button>
      </div>

      <div className="mt-10 rounded-xl border border-brand-200 bg-brand-50/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700">
          Demo Controls
        </h2>
        <p className="mt-2 text-sm text-brand-600">
          Use scripted fallback interview content for reliable hackathon demos.
        </p>

        <label className="mt-4 flex items-center gap-3 text-sm font-medium text-brand-800">
          <input
            type="checkbox"
            checked={state.demo.enabled}
            onChange={(event) => actions.setDemoEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          />
          Enable Demo Mode
        </label>

        <fieldset
          className="mt-4"
          disabled={!state.demo.enabled}
        >
          <legend className="text-sm font-medium text-brand-800">Demo Length</legend>
          <div className="mt-2 inline-flex rounded-lg border border-brand-200 bg-white p-1">
            <button
              type="button"
              onClick={() => actions.setDemoProfile("three-min")}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                state.demo.profile === "three-min"
                  ? "bg-brand-600 text-maize-50"
                  : "text-brand-700 hover:bg-brand-50",
              ].join(" ")}
            >
              3 Min (2 Q/A)
            </button>
            <button
              type="button"
              onClick={() => actions.setDemoProfile("ten-min")}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                state.demo.profile === "ten-min"
                  ? "bg-brand-600 text-maize-50"
                  : "text-brand-700 hover:bg-brand-50",
              ].join(" ")}
            >
              10 Min (10 Q/A)
            </button>
          </div>
        </fieldset>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {state.demo.error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.demo.error}
            </p>
          ) : (
            <p className="text-xs text-brand-500">
              Demo controls reset each time this page is opened.
            </p>
          )}
          <button
            type="button"
            onClick={handleRunDemo}
            disabled={!state.demo.enabled}
            className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-maize-50 transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Run Automated Demo
          </button>
        </div>
      </div>
    </section>
  );
}
