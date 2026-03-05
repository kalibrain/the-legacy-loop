"use client";

import { RepoConfig } from "@/types/legacy-loop";

type RepoDetailsFormProps = {
  sourceId: "github" | "gitlab" | "jira";
  value?: RepoConfig;
  onChange: (next: RepoConfig) => void;
};

export function RepoDetailsForm({
  sourceId,
  value,
  onChange,
}: RepoDetailsFormProps) {
  const sourceLabel =
    sourceId === "github" ? "GitHub" : sourceId === "gitlab" ? "GitLab" : "Jira";

  return (
    <div className="card-surface rounded-xl p-6">
      <h2 className="text-xl font-semibold text-slate-900">{sourceLabel} Details</h2>
      <p className="mt-2 text-sm text-slate-600">
        Provide a repository or project link to include commit and ticket context.
      </p>

      <div className="mt-5">
        <label
          htmlFor={`${sourceId}-repo-link`}
          className="text-sm font-medium text-slate-700"
        >
          Project / Repository Link
        </label>
        <input
          id={`${sourceId}-repo-link`}
          type="url"
          value={value?.repoLink ?? ""}
          onChange={(event) =>
            onChange({
              type: sourceId,
              repoLink: event.target.value,
            })
          }
          placeholder={
            sourceId === "jira"
              ? "https://company.atlassian.net/jira/software/projects/..."
              : `https://${sourceId}.com/...`
          }
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>
    </div>
  );
}
