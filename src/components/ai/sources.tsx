"use client";

import React from "react";

type SourcesProps = {
  children: React.ReactNode;
};

export function Sources({ children }: SourcesProps) {
  return (
    <details className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
      {children}
    </details>
  );
}

type SourcesTriggerProps = {
  count: number;
};

export function SourcesTrigger({ count }: SourcesTriggerProps) {
  return (
    <summary className="cursor-pointer font-medium text-slate-700">
      Sources ({count})
    </summary>
  );
}

type SourcesContentProps = {
  children: React.ReactNode;
};

export function SourcesContent({ children }: SourcesContentProps) {
  return <ul className="mt-2 space-y-1">{children}</ul>;
}

type SourceProps = {
  title: string;
  type?: string;
};

export function Source({ title, type }: SourceProps) {
  return (
    <li className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
      {title}
      {type ? <span className="ml-1 text-slate-500">({type})</span> : null}
    </li>
  );
}
