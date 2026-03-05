"use client";

import { useRouter } from "next/navigation";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { PRELOADED_INTERVIEW_DOCUMENTS } from "@/lib/constants";

export default function StartPage() {
  const router = useRouter();
  const { actions } = useLegacyLoop();

  const handleStart = () => {
    actions.resetDemo();
    router.push("/collect");
  };

  return (
    <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-10 shadow-soft">
      <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
        Legacy Loop
      </span>
      <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
        AI-Powered Knowledge Transfer for Employee Offboarding
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">
        Capture undocumented workflows, decisions, and troubleshooting playbooks
        before knowledge walks out the door.
      </p>

      <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-900">
        This interview was initiated by your manager, supervisor, or HR partner.
        They may have already uploaded supporting documents that will help guide
        question generation.
      </div>

      <div className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Preloaded By Leadership
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {PRELOADED_INTERVIEW_DOCUMENTS.map((document) => (
              <li key={document}>• {document}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            How Questions Are Built
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Interview questions are generated from supervisor-uploaded documents
            plus the sources and files collected during this flow. Your answers
            will further refine follow-up questions.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        aria-label="Start exit interview flow"
        className="mt-8 rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      >
        Start Exit Interview
      </button>
    </section>
  );
}
