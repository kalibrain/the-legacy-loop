import { FlowState } from "@/types/legacy-loop";
import { FlowStepId } from "@/lib/constants";
import { getFirstUnconfiguredSource } from "@/lib/source-validation";

export function getStepIdFromPath(pathname: string): FlowStepId {
  if (pathname.startsWith("/finish")) return "finish";
  if (pathname.startsWith("/interview")) return "interview";
  if (pathname.startsWith("/collect/complete")) return "review";
  if (pathname.startsWith("/collect/upload")) return "review";
  if (pathname.startsWith("/collect/source/")) return "configure";
  if (pathname.startsWith("/collect")) return "collect";
  return "start";
}

export function getFlowRedirect(pathname: string, state: FlowState): string | null {
  const selectedSources = state.selectedSources;
  const firstSelected = selectedSources[0];
  const unconfiguredSource = getFirstUnconfiguredSource(
    selectedSources,
    state.sourceDetails,
  );

  if (pathname.startsWith("/collect/source/")) {
    if (selectedSources.length === 0) return "/collect";

    const currentSource = pathname.split("/")[3] ?? "";
    if (!selectedSources.includes(currentSource as typeof selectedSources[number])) {
      return firstSelected ? `/collect/source/${firstSelected}` : "/collect";
    }

    if (unconfiguredSource) {
      const unconfiguredIndex = selectedSources.indexOf(unconfiguredSource);
      const currentIndex = selectedSources.indexOf(
        currentSource as typeof selectedSources[number],
      );
      if (currentIndex > unconfiguredIndex) {
        return `/collect/source/${unconfiguredSource}`;
      }
    }
  }

  if (pathname.startsWith("/collect/upload")) {
    if (selectedSources.length === 0) return "/collect";
    if (unconfiguredSource) return `/collect/source/${unconfiguredSource}`;
  }

  if (pathname.startsWith("/collect/complete")) {
    if (selectedSources.length === 0) return "/collect";
    if (unconfiguredSource) return `/collect/source/${unconfiguredSource}`;
    if (!state.collection.completed) return "/collect/upload";
  }

  if (pathname.startsWith("/interview")) {
    if (selectedSources.length === 0) return "/collect";
    if (unconfiguredSource) return `/collect/source/${unconfiguredSource}`;
    if (!state.collection.completed) return "/collect/upload";
    if (!state.consentAccepted) return "/collect/complete";
  }

  if (pathname.startsWith("/finish")) {
    if (selectedSources.length === 0) return "/collect";
    if (unconfiguredSource) return `/collect/source/${unconfiguredSource}`;
    if (!state.collection.completed) return "/collect/upload";
    if (!state.consentAccepted) return "/collect/complete";
    if (!state.interview.done) return "/interview";
  }

  return null;
}
