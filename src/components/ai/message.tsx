"use client";

import React from "react";

type MessageProps = React.HTMLAttributes<HTMLDivElement> & {
  from: "assistant" | "user";
};

export function Message({ from, className = "", ...props }: MessageProps) {
  return (
    <div
      className={`flex ${from === "user" ? "justify-end" : "justify-start"} ${className}`}
      {...props}
    />
  );
}

type MessageContentProps = React.HTMLAttributes<HTMLDivElement> & {
  from: "assistant" | "user";
};

export function MessageContent({
  from,
  className = "",
  ...props
}: MessageContentProps) {
  return (
    <div
      className={[
        "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
        from === "user"
          ? "bg-brand-600 text-maize-50"
          : "border border-brand-100 bg-brand-50/70 text-brand-800",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

type MessageResponseProps = React.HTMLAttributes<HTMLDivElement>;

export function MessageResponse({ className = "", ...props }: MessageResponseProps) {
  return <div className={`whitespace-pre-wrap ${className}`} {...props} />;
}
