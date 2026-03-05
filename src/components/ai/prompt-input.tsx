"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type PromptInputMessage = {
  text: string;
};

type PromptStatus = "submitted" | "streaming" | "ready" | "error";

type PromptInputContextValue = {
  text: string;
  setText: (value: string) => void;
  status: PromptStatus;
};

const PromptInputContext = createContext<PromptInputContextValue | undefined>(
  undefined,
);

type PromptInputProps = {
  children: React.ReactNode;
  onSubmit: (message: PromptInputMessage) => void;
  status?: PromptStatus;
  className?: string;
};

export function PromptInput({
  children,
  onSubmit,
  status = "ready",
  className = "",
}: PromptInputProps) {
  const [text, setText] = useState("");

  const contextValue = useMemo(
    () => ({ text, setText, status }),
    [status, text],
  );

  return (
    <PromptInputContext.Provider value={contextValue}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ text });
          setText("");
        }}
        className={`rounded-xl border border-slate-200 bg-white p-3 shadow-soft ${className}`}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
}

function usePromptInputContext() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("PromptInput components must be used inside PromptInput.");
  }
  return context;
}

type PromptInputBodyProps = {
  children: React.ReactNode;
};

export function PromptInputBody({ children }: PromptInputBodyProps) {
  return <div>{children}</div>;
}

type PromptInputFooterProps = {
  children: React.ReactNode;
};

export function PromptInputFooter({ children }: PromptInputFooterProps) {
  return <div className="mt-3 flex items-center justify-end gap-2">{children}</div>;
}

type PromptInputTextareaProps = {
  placeholder?: string;
  rows?: number;
};

export function PromptInputTextarea({
  placeholder = "Type your response...",
  rows = 4,
}: PromptInputTextareaProps) {
  const { text, setText } = usePromptInputContext();

  return (
    <textarea
      value={text}
      onChange={(event) => setText(event.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      aria-label="Interview chat input"
    />
  );
}

type PromptInputSubmitProps = {
  status?: PromptStatus;
  disabled?: boolean;
};

export function PromptInputSubmit({
  status,
  disabled,
}: PromptInputSubmitProps) {
  const context = usePromptInputContext();
  const currentStatus = status ?? context.status;

  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Send chat message"
    >
      {currentStatus === "streaming" ? "Thinking..." : "Send"}
    </button>
  );
}
