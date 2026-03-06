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
