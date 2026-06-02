"use client";
import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type { Me, SetDoc } from "@/lib/types";

type AppState = {
  me: Me | null;
  sets: SetDoc[];
  communityTags: string[];
  loading: boolean;
};

type Action =
  | { type: "SET_ME"; me: Me | null }
  | { type: "SET_SETS"; sets: SetDoc[] }
  | { type: "SET_COMMUNITY_TAGS"; tags: string[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "ADD_SET"; set: SetDoc }
  | { type: "UPDATE_SET"; set: SetDoc }
  | { type: "REMOVE_SET"; id: string };

const initial: AppState = { me: null, sets: [], communityTags: [], loading: true };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_ME":       return { ...state, me: action.me };
    case "SET_SETS":     return { ...state, sets: action.sets };
    case "SET_COMMUNITY_TAGS": return { ...state, communityTags: action.tags };
    case "SET_LOADING":  return { ...state, loading: action.loading };
    case "ADD_SET":      return { ...state, sets: [action.set, ...state.sets] };
    case "UPDATE_SET":   return { ...state, sets: state.sets.map(s => s._id === action.set._id ? action.set : s) };
    case "REMOVE_SET":   return { ...state, sets: state.sets.filter(s => s._id !== action.id) };
    default:             return state;
  }
}

const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function AppProvider({
  children,
  initialMe,
  initialSets,
}: {
  children: ReactNode;
  initialMe?: Me | null;
  initialSets?: SetDoc[];
}) {
  const [state, dispatch] = useReducer(reducer, {
    ...initial,
    me: initialMe ?? null,
    sets: initialSets ?? [],
    loading: false,
  });
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
