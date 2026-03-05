"use client";

import React from "react";

type ConversationProps = React.HTMLAttributes<HTMLDivElement>;

export const Conversation = React.forwardRef<HTMLDivElement, ConversationProps>(
  function Conversation({ className = "", ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`relative overflow-y-auto rounded-xl border border-slate-200 bg-white ${className}`}
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
};

export function ConversationScrollButton({
  targetId = "interview-conversation",
}: ConversationScrollButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        const container = document.getElementById(targetId);
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }}
      className="absolute bottom-3 right-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50"
      aria-label="Scroll to latest message"
    >
      Latest
    </button>
  );
}
