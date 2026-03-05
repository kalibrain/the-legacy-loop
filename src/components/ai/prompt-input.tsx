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
        className={`rounded-xl border border-brand-200 bg-white/95 p-3 shadow-soft ${className}`}
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
  className?: string;
};

export function PromptInputFooter({
  children,
  className = "",
}: PromptInputFooterProps) {
  return (
    <div className={`mt-3 flex items-center justify-end gap-2 ${className}`}>
      {children}
    </div>
  );
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
      className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none placeholder:text-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-maize-300"
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
      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-maize-50 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maize-400 disabled:cursor-not-allowed disabled:opacity-60"
      aria-label="Send chat message"
    >
      {currentStatus === "streaming" ? "Thinking..." : "Send"}
    </button>
  );
}
