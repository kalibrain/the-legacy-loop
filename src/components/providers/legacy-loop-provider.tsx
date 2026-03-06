"use client";

import {
  CollectionStats,
  DataSourceId,
  DemoProfile,
  FlowState,
  InterviewSummaryItem,
  SourceConfig,
} from "@/types/legacy-loop";
import {
  clearPersistedState,
  loadPersistedState,
  savePersistedState,
} from "@/lib/storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

type Action =
  | { type: "HYDRATE"; payload: FlowState }
  | { type: "RESET_DEMO" }
  | { type: "SET_DEMO_ENABLED"; payload: boolean }
  | { type: "SET_DEMO_PROFILE"; payload: DemoProfile }
  | { type: "START_DEMO_RUN" }
  | { type: "STOP_DEMO_RUN"; payload?: string }
  | { type: "RESET_DEMO_CONTROLS" }
  | { type: "SET_SOURCES"; payload: DataSourceId[] }
  | { type: "SET_SOURCE_DETAIL"; payload: { sourceId: DataSourceId; detail: SourceConfig } }
  | { type: "CLEAR_SOURCE_DETAIL"; payload: DataSourceId }
  | { type: "SET_COLLECTION_IN_PROGRESS"; payload: boolean }
  | { type: "SET_COLLECTION_COMPLETE"; payload: CollectionStats }
  | { type: "SET_CONSENT"; payload: boolean }
  | { type: "INIT_INTERVIEW"; payload: { sessionId: string; totalQuestions: number } }
  | { type: "SET_INTERVIEW_PROGRESS"; payload: { answeredCount: number; totalQuestions: number } }
  | { type: "SET_INTERVIEW_SUMMARY"; payload: InterviewSummaryItem[] }
  | { type: "COMPLETE_INTERVIEW"; payload: { answeredCount: number; totalQuestions: number } }
  | { type: "CLEAR_INTERVIEW" };

type LegacyLoopContextValue = {
  state: FlowState;
  isHydrated: boolean;
  actions: {
    resetDemo: () => void;
    setDemoEnabled: (enabled: boolean) => void;
    setDemoProfile: (profile: DemoProfile) => void;
    startDemoRun: () => void;
    stopDemoRun: (errorMessage?: string) => void;
    resetDemoControls: () => void;
    setSelectedSources: (sources: DataSourceId[]) => void;
    setSourceDetail: (sourceId: DataSourceId, detail: SourceConfig) => void;
    clearSourceDetail: (sourceId: DataSourceId) => void;
    setCollectionInProgress: (inProgress: boolean) => void;
    setCollectionComplete: (stats: CollectionStats) => void;
    setConsentAccepted: (accepted: boolean) => void;
    initializeInterview: (sessionId: string, totalQuestions: number) => void;
    setInterviewProgress: (answeredCount: number, totalQuestions: number) => void;
    setInterviewSummary: (summary: InterviewSummaryItem[]) => void;
    completeInterview: (answeredCount: number, totalQuestions: number) => void;
    clearInterview: () => void;
  };
};

function defaultDemoState(): FlowState["demo"] {
  return {
    enabled: false,
    profile: "three-min",
    running: false,
    error: undefined,
  };
}

const initialState: FlowState = {
  demo: defaultDemoState(),
  selectedSources: [],
  sourceDetails: {},
  collection: {
    inProgress: false,
    completed: false,
  },
  consentAccepted: false,
  interview: {
    answeredCount: 0,
    totalQuestions: 0,
    done: false,
    summary: [],
  },
};

function emptyInterviewState(): FlowState["interview"] {
  return {
    answeredCount: 0,
    totalQuestions: 0,
    done: false,
    sessionId: undefined,
    summary: [],
  };
}

function resetDownstreamState(state: FlowState): FlowState {
  return {
    ...state,
    collection: { inProgress: false, completed: false, stats: undefined },
    consentAccepted: false,
    interview: emptyInterviewState(),
  };
}

function flowReducer(state: FlowState, action: Action): FlowState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...initialState,
        ...action.payload,
        demo: {
          ...initialState.demo,
          ...action.payload.demo,
        },
        collection: {
          ...initialState.collection,
          ...action.payload.collection,
        },
        interview: {
          ...initialState.interview,
          ...action.payload.interview,
        },
      };
    case "RESET_DEMO":
      return initialState;
    case "SET_DEMO_ENABLED":
      return {
        ...state,
        demo: {
          ...state.demo,
          enabled: action.payload,
        },
      };
    case "SET_DEMO_PROFILE":
      return {
        ...state,
        demo: {
          ...state.demo,
          profile: action.payload,
        },
      };
    case "START_DEMO_RUN":
      return {
        ...state,
        demo: {
          ...state.demo,
          enabled: true,
          running: true,
          error: undefined,
        },
      };
    case "STOP_DEMO_RUN":
      return {
        ...state,
        demo: {
          ...state.demo,
          running: false,
          error: action.payload,
        },
      };
    case "RESET_DEMO_CONTROLS":
      return {
        ...state,
        demo: defaultDemoState(),
      };
    case "SET_SOURCES": {
      const filteredDetails: Partial<Record<DataSourceId, SourceConfig>> = {};
      for (const sourceId of action.payload) {
        const existing = state.sourceDetails[sourceId];
        if (existing) {
          filteredDetails[sourceId] = existing;
        }
      }

      return {
        ...resetDownstreamState(state),
        selectedSources: action.payload,
        sourceDetails: filteredDetails,
      };
    }
    case "SET_SOURCE_DETAIL":
      return {
        ...resetDownstreamState(state),
        sourceDetails: {
          ...state.sourceDetails,
          [action.payload.sourceId]: action.payload.detail,
        },
      };
    case "CLEAR_SOURCE_DETAIL": {
      const nextDetails = { ...state.sourceDetails };
      delete nextDetails[action.payload];
      return {
        ...resetDownstreamState(state),
        sourceDetails: nextDetails,
      };
    }
    case "SET_COLLECTION_IN_PROGRESS":
      if (action.payload) {
        return {
          ...state,
          collection: { inProgress: true, completed: false },
          consentAccepted: false,
          interview: emptyInterviewState(),
        };
      }
      return {
        ...state,
        collection: {
          ...state.collection,
          inProgress: false,
        },
      };
    case "SET_COLLECTION_COMPLETE":
      return {
        ...state,
        collection: {
          inProgress: false,
          completed: true,
          stats: action.payload,
        },
        consentAccepted: false,
        interview: emptyInterviewState(),
      };
    case "SET_CONSENT":
      return {
        ...state,
        consentAccepted: action.payload,
      };
    case "INIT_INTERVIEW":
      return {
        ...state,
        interview: {
          answeredCount: 0,
          done: false,
          sessionId: action.payload.sessionId,
          totalQuestions: action.payload.totalQuestions,
          summary: [],
        },
      };
    case "SET_INTERVIEW_PROGRESS":
      return {
        ...state,
        interview: {
          ...state.interview,
          answeredCount: action.payload.answeredCount,
          totalQuestions: action.payload.totalQuestions,
          done: false,
        },
      };
    case "SET_INTERVIEW_SUMMARY":
      return {
        ...state,
        interview: {
          ...state.interview,
          summary: action.payload,
        },
      };
    case "COMPLETE_INTERVIEW":
      return {
        ...state,
        interview: {
          ...state.interview,
          answeredCount: action.payload.answeredCount,
          totalQuestions: action.payload.totalQuestions,
          done: true,
        },
      };
    case "CLEAR_INTERVIEW":
      return {
        ...state,
        interview: emptyInterviewState(),
      };
    default:
      return state;
  }
}

const LegacyLoopContext = createContext<LegacyLoopContextValue | undefined>(undefined);

export function LegacyLoopProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(flowReducer, initialState);
  const [isHydrated, markHydrated] = useReducer(() => true, false);

  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      dispatch({ type: "HYDRATE", payload: persisted });
    }
    markHydrated();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    savePersistedState(state);
  }, [state, isHydrated]);

  const resetDemo = useCallback(() => {
    clearPersistedState();
    dispatch({ type: "RESET_DEMO" });
  }, []);

  const actions = useMemo<LegacyLoopContextValue["actions"]>(
    () => ({
      resetDemo,
      setDemoEnabled: (enabled) =>
        dispatch({ type: "SET_DEMO_ENABLED", payload: enabled }),
      setDemoProfile: (profile) =>
        dispatch({ type: "SET_DEMO_PROFILE", payload: profile }),
      startDemoRun: () => dispatch({ type: "START_DEMO_RUN" }),
      stopDemoRun: (errorMessage) =>
        dispatch({ type: "STOP_DEMO_RUN", payload: errorMessage }),
      resetDemoControls: () => dispatch({ type: "RESET_DEMO_CONTROLS" }),
      setSelectedSources: (sources) =>
        dispatch({ type: "SET_SOURCES", payload: sources }),
      setSourceDetail: (sourceId, detail) =>
        dispatch({ type: "SET_SOURCE_DETAIL", payload: { sourceId, detail } }),
      clearSourceDetail: (sourceId) =>
        dispatch({ type: "CLEAR_SOURCE_DETAIL", payload: sourceId }),
      setCollectionInProgress: (inProgress) =>
        dispatch({
          type: "SET_COLLECTION_IN_PROGRESS",
          payload: inProgress,
        }),
      setCollectionComplete: (stats) =>
        dispatch({ type: "SET_COLLECTION_COMPLETE", payload: stats }),
      setConsentAccepted: (accepted) =>
        dispatch({ type: "SET_CONSENT", payload: accepted }),
      initializeInterview: (sessionId, totalQuestions) =>
        dispatch({
          type: "INIT_INTERVIEW",
          payload: { sessionId, totalQuestions },
        }),
      setInterviewProgress: (answeredCount, totalQuestions) =>
        dispatch({
          type: "SET_INTERVIEW_PROGRESS",
          payload: { answeredCount, totalQuestions },
        }),
      setInterviewSummary: (summary) =>
        dispatch({
          type: "SET_INTERVIEW_SUMMARY",
          payload: summary,
        }),
      completeInterview: (answeredCount, totalQuestions) =>
        dispatch({
          type: "COMPLETE_INTERVIEW",
          payload: { answeredCount, totalQuestions },
        }),
      clearInterview: () => dispatch({ type: "CLEAR_INTERVIEW" }),
    }),
    [resetDemo],
  );

  const contextValue = useMemo<LegacyLoopContextValue>(
    () => ({
      state,
      isHydrated,
      actions,
    }),
    [actions, isHydrated, state],
  );

  return (
    <LegacyLoopContext.Provider value={contextValue}>
      {children}
    </LegacyLoopContext.Provider>
  );
}

export function useLegacyLoop(): LegacyLoopContextValue {
  const context = useContext(LegacyLoopContext);
  if (!context) {
    throw new Error("useLegacyLoop must be used inside LegacyLoopProvider");
  }
  return context;
}
