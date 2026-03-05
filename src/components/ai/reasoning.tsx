"use client";

import React from "react";

type ReasoningProps = {
  children: React.ReactNode;
};

export function Reasoning({ children }: ReasoningProps) {
  return (
    <details className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
      {children}
    </details>
  );
}

type ReasoningTriggerProps = {
  label?: string;
};

export function ReasoningTrigger({ label = "Reasoning" }: ReasoningTriggerProps) {
  return (
    <summary className="cursor-pointer font-medium text-slate-700">
      {label}
    </summary>
  );
}

type ReasoningContentProps = {
  children: React.ReactNode;
};

export function ReasoningContent({ children }: ReasoningContentProps) {
  return <div className="mt-2 leading-relaxed text-slate-600">{children}</div>;
}
