"use client";

import { generateMockChannels } from "@/lib/mock-source-data";
import { ChatConfig } from "@/types/legacy-loop";

type ChatDetailsFormProps = {
  sourceId: "slack" | "microsoft-teams";
  value?: ChatConfig;
  onChange: (next: ChatConfig) => void;
};

export function ChatDetailsForm({
  sourceId,
  value,
  onChange,
}: ChatDetailsFormProps) {
  const workspaceLink = value?.workspaceLink ?? "";
  const channels = value?.channels ?? [];
  const sourceLabel = sourceId === "slack" ? "Slack" : "Microsoft Teams";

  const ensureBaseConfig = (): ChatConfig => ({
    type: sourceId,
    workspaceLink,
    channels,
  });

  const handleLoadChannels = () => {
    const generated = generateMockChannels(workspaceLink, sourceId);
    const selectedById = new Map(
      channels.map((channel) => [channel.id, channel.selected]),
    );

    const merged = generated.map((channel) => ({
      ...channel,
      selected: selectedById.get(channel.id) ?? channel.selected,
    }));

    onChange({
      ...ensureBaseConfig(),
      channels: merged,
    });
  };

  return (
    <div className="card-surface rounded-xl p-6">
      <h2 className="text-xl font-semibold text-slate-900">{sourceLabel} Details</h2>
      <p className="mt-2 text-sm text-slate-600">
        Add workspace link, then load and select channels to include user message
        history.
      </p>

      <div className="mt-5">
        <label
          htmlFor={`${sourceId}-workspace-link`}
          className="text-sm font-medium text-slate-700"
        >
          Workspace Link
        </label>
        <input
          id={`${sourceId}-workspace-link`}
          type="url"
          value={workspaceLink}
          onChange={(event) =>
            onChange({
              ...ensureBaseConfig(),
              workspaceLink: event.target.value,
            })
          }
          placeholder={
            sourceId === "slack"
              ? "https://company.slack.com"
              : "https://teams.microsoft.com/..."
          }
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <button
        type="button"
        onClick={handleLoadChannels}
        disabled={workspaceLink.trim().length === 0}
        aria-label={`Load channels for ${sourceLabel}`}
        className="mt-4 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Load Channels
      </button>

      {channels.length > 0 ? (
        <div className="mt-5 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">
            Select Channels ({channels.filter((channel) => channel.selected).length}/
            {channels.length})
          </p>
          {channels.map((channel) => (
            <label
              key={channel.id}
              className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 hover:bg-white"
            >
              <input
                type="checkbox"
                checked={channel.selected}
                onChange={(event) =>
                  onChange({
                    ...ensureBaseConfig(),
                    channels: channels.map((entry) =>
                      entry.id === channel.id
                        ? { ...entry, selected: event.target.checked }
                        : entry,
                    ),
                  })
                }
                aria-label={`Select channel ${channel.name}`}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>{channel.name}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
