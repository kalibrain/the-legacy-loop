"use client";

import { ALLOWED_FILE_EXTENSIONS } from "@/lib/constants";
import {
  extractUploadedFileMeta,
  mergeUploadedFiles,
} from "@/lib/file-upload";
import { OtherUploadConfig } from "@/types/legacy-loop";
import { useState } from "react";

type UploadDetailsFormProps = {
  value?: OtherUploadConfig;
  onChange: (next: OtherUploadConfig) => void;
};

export function UploadDetailsForm({ value, onChange }: UploadDetailsFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const files = value?.files ?? [];

  const acceptFiles = (fileList: File[]) => {
    const { accepted, rejectedCount } = extractUploadedFileMeta(fileList);
    if (rejectedCount > 0) {
      setFileError(
        `Ignored ${rejectedCount} file(s). Allowed formats: ${ALLOWED_FILE_EXTENSIONS.join(
          ", ",
        )}.`,
      );
    } else {
      setFileError(null);
    }

    if (accepted.length === 0) return;
    onChange({
      type: "other",
      files: mergeUploadedFiles(files, accepted),
    });
  };

  return (
    <div className="card-surface rounded-xl p-6">
      <h2 className="text-xl font-semibold text-slate-900">Other Source Upload</h2>
      <p className="mt-2 text-sm text-slate-600">
        Upload files for custom knowledge sources not covered by built-in connectors.
      </p>

      <div
        role="button"
        tabIndex={0}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          acceptFiles(Array.from(event.dataTransfer.files));
        }}
        aria-label="Upload files for other source"
        className={[
          "mt-4 rounded-lg border-2 border-dashed p-5 text-center text-sm transition",
          isDragging
            ? "border-brand-500 bg-brand-50 text-brand-900"
            : "border-slate-300 bg-slate-50 text-slate-600",
        ].join(" ")}
      >
        Drop files here or use the file picker.
      </div>
      <input
        type="file"
        accept=".txt,.md,.json"
        multiple
        onChange={(event) => acceptFiles(Array.from(event.target.files ?? []))}
        aria-label="File picker for other source uploads"
        className="mt-3 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:font-semibold file:text-brand-800 hover:file:bg-brand-200"
      />

      {files.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.type}`}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            >
              {file.name}
            </li>
          ))}
        </ul>
      ) : null}

      {fileError ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {fileError}
        </p>
      ) : null}
    </div>
  );
}
