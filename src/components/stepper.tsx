"use client";

import { useRouter } from "next/navigation";
import { useLegacyLoop } from "@/components/providers/legacy-loop-provider";
import { FlowStepId, FLOW_STEPS } from "@/lib/constants";
import { getStepIdFromPath } from "@/lib/flow-guards";

type StepperProps = {
  currentPath: string;
};

function getStepTargetPath(stepId: FlowStepId, firstSelectedSource?: string): string {
  switch (stepId) {
    case "start":
      return "/start";
    case "collect":
      return "/collect";
    case "configure":
      return firstSelectedSource ? `/collect/source/${firstSelectedSource}` : "/collect";
    case "review":
      return "/collect/upload";
    case "interview":
      return "/interview";
    case "finish":
      return "/finish";
    default:
      return "/start";
  }
}

export function Stepper({ currentPath }: StepperProps) {
  const router = useRouter();
  const { state } = useLegacyLoop();
  const currentStepId = getStepIdFromPath(currentPath);
  const currentIndex = FLOW_STEPS.findIndex((step) => step.id === currentStepId);
  const firstSelectedSource = state.selectedSources[0];

  return (
    <nav aria-label="Progress" className="mb-8 overflow-x-auto">
      <ol className="flex min-w-[760px] items-center gap-4 rounded-xl border border-brand-200 bg-white/95 px-4 py-4 shadow-soft">
        {FLOW_STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = isComplete;
          const targetPath = getStepTargetPath(step.id, firstSelectedSource);
          const itemClasses = [
            "flex min-w-[110px] items-center gap-3 rounded-md",
            isClickable
              ? "cursor-pointer px-1 py-1 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-300"
              : "",
          ].join(" ");

          const content = (
            <>
              <span
                className={[
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                  isComplete
                    ? "border-brand-600 bg-brand-600 text-maize-100"
                    : isCurrent
                      ? "border-brand-600 bg-maize-100 text-brand-700"
                      : "border-brand-100 bg-brand-50 text-brand-400",
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                {index + 1}
              </span>
              <span
                className={[
                  "text-sm font-medium",
                  isCurrent
                    ? "text-brand-800"
                    : isComplete
                      ? "text-brand-700"
                      : "text-slate-500",
                ].join(" ")}
              >
                {step.label}
              </span>
            </>
          );

          return (
            <li key={step.id}>
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => router.push(targetPath)}
                  className={itemClasses}
                  aria-label={`Go back to ${step.label}`}
                >
                  {content}
                </button>
              ) : (
                <div className={itemClasses}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
