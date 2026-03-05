"use client";

import { FLOW_STEPS } from "@/lib/constants";
import { getStepIdFromPath } from "@/lib/flow-guards";

type StepperProps = {
  currentPath: string;
};

export function Stepper({ currentPath }: StepperProps) {
  const currentStepId = getStepIdFromPath(currentPath);
  const currentIndex = FLOW_STEPS.findIndex((step) => step.id === currentStepId);

  return (
    <nav aria-label="Progress" className="mb-8 overflow-x-auto">
      <ol className="flex min-w-[760px] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-soft">
        {FLOW_STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.id} className="flex min-w-[110px] items-center gap-3">
              <span
                className={[
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                  isComplete
                    ? "border-brand-600 bg-brand-600 text-white"
                    : isCurrent
                      ? "border-brand-600 bg-brand-100 text-brand-800"
                      : "border-slate-300 bg-slate-100 text-slate-500",
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                {index + 1}
              </span>
              <span
                className={[
                  "text-sm font-medium",
                  isCurrent
                    ? "text-slate-900"
                    : isComplete
                      ? "text-brand-700"
                      : "text-slate-500",
                ].join(" ")}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
