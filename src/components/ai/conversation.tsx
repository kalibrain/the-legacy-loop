"use client";

import React from "react";

type ConversationProps = React.HTMLAttributes<HTMLDivElement>;

export const Conversation = React.forwardRef<HTMLDivElement, ConversationProps>(
  function Conversation({ className = "", ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`relative overflow-y-auto rounded-xl border border-brand-200 bg-white/95 shadow-soft ${className}`}
        {...props}
      />
    );
  },
);

type ConversationContentProps = React.HTMLAttributes<HTMLDivElement>;

export function ConversationContent({
  className = "",
  ...props
}: ConversationContentProps) {
  return <div className={`space-y-4 p-4 md:p-6 ${className}`} {...props} />;
}

type ConversationScrollButtonProps = {
  targetId?: string;
  className?: string;
};

export function ConversationScrollButton({
  targetId = "interview-conversation",
  className = "",
}: ConversationScrollButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        const container = document.getElementById(targetId);
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }}
      className={`rounded-lg border border-brand-200 bg-maize-100 px-3 py-2 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-maize-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${className}`}
      aria-label="Scroll to latest message"
    >
      Latest
    </button>
  );
}
