"use client";

import React from "react";

type ReasoningProps = {
  children: React.ReactNode;
};

export function Reasoning({ children }: ReasoningProps) {
  return (
    <details className="mt-2 rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2 text-xs text-brand-700">
      {children}
    </details>
  );
}

type ReasoningTriggerProps = {
  label?: string;
};

export function ReasoningTrigger({ label = "Reasoning" }: ReasoningTriggerProps) {
  return (
    <summary className="cursor-pointer font-medium text-brand-700">
      {label}
    </summary>
  );
}

type ReasoningContentProps = {
  children: React.ReactNode;
};

export function ReasoningContent({ children }: ReasoningContentProps) {
  return <div className="mt-2 leading-relaxed text-brand-500">{children}</div>;
}
