"use client";

import { ALLOWED_FILE_EXTENSIONS } from "@/lib/constants";
import {
  extractUploadedFileMeta,
  mergeUploadedFiles,
} from "@/lib/file-upload";
import { GoogleDriveConfig } from "@/types/legacy-loop";
import { useState } from "react";

type DriveDetailsFormProps = {
  value?: GoogleDriveConfig;
  onChange: (next: GoogleDriveConfig) => void;
};

export function DriveDetailsForm({ value, onChange }: DriveDetailsFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const mode = value?.mode ?? "link";
  const linkValue = value?.type === "google-drive" && value.mode === "link" ? value.link : "";
  const files =
    value?.type === "google-drive" && value.mode === "upload" ? value.files : [];

  const setMode = (nextMode: "link" | "upload") => {
    if (nextMode === "link") {
      onChange({
        type: "google-drive",
        mode: "link",
        link: "",
      });
      return;
    }

    onChange({
      type: "google-drive",
      mode: "upload",
      files: [],
    });
  };

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
      type: "google-drive",
      mode: "upload",
      files: mergeUploadedFiles(files, accepted),
    });
  };

  return (
    <div className="card-surface rounded-xl p-6">
      <h2 className="text-xl font-semibold text-slate-900">Google Drive Details</h2>
      <p className="mt-2 text-sm text-slate-600">
        Provide a Drive link or upload documents to include in knowledge collection.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input
            type="radio"
            name="drive-mode"
            className="mr-2"
            checked={mode === "link"}
            onChange={() => setMode("link")}
            aria-label="Use Google Drive link"
          />
          <span className="text-sm font-medium text-slate-800">Use Drive Link</span>
        </label>
        <label className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <input
            type="radio"
            name="drive-mode"
            className="mr-2"
            checked={mode === "upload"}
            onChange={() => setMode("upload")}
            aria-label="Upload Google Drive files"
          />
          <span className="text-sm font-medium text-slate-800">Upload Files</span>
        </label>
      </div>

      {mode === "link" ? (
        <div className="mt-5">
          <label
            htmlFor="drive-link"
            className="text-sm font-medium text-slate-700"
          >
            Google Drive Link
          </label>
          <input
            id="drive-link"
            type="url"
            value={linkValue}
            onChange={(event) =>
              onChange({
                type: "google-drive",
                mode: "link",
                link: event.target.value,
              })
            }
            placeholder="https://drive.google.com/..."
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
      ) : (
        <div className="mt-5">
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
            aria-label="Upload files for Google Drive source"
            className={[
              "rounded-lg border-2 border-dashed p-5 text-center text-sm transition",
              isDragging
                ? "border-brand-500 bg-brand-50 text-brand-900"
                : "border-slate-300 bg-slate-50 text-slate-600",
            ].join(" ")}
          >
            Drop files here or use the file picker below.
          </div>
          <input
            type="file"
            accept=".txt,.md,.json"
            multiple
            onChange={(event) => acceptFiles(Array.from(event.target.files ?? []))}
            aria-label="File picker for Google Drive files"
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
      )}
    </div>
  );
}
