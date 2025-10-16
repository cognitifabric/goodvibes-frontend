"use client";
import React, { createContext, useContext, useReducer } from "react";
import type { Me, SetDoc } from "@/lib/types";

type State = { me: Me | null; sets: SetDoc[]; };
type Action =
  | { type: "SET_ME"; me: Me | null }
  | { type: "SET_SETS"; sets: SetDoc[] }
  | { type: "ADD_SET"; set: SetDoc }
  | { type: "UPDATE_SET"; set: SetDoc }
  | { type: "REMOVE_SET"; id: string }
  | { type: "LOGOUT" };

const AppContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function appReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ME": return { ...state, me: action.me };
    case "SET_SETS": return { ...state, sets: action.sets };
    case "ADD_SET":
      // append the new set so it appears at the bottom of the list
      return { ...state, sets: [...state.sets, action.set] };
    case "UPDATE_SET": return { ...state, sets: state.sets.map(s => s._id === action.set._id ? action.set : s) };
    case "REMOVE_SET": return { ...state, sets: state.sets.filter(s => s._id !== action.id) };
    case "LOGOUT": return { me: null, sets: [] };
    default: return state;
  }
}

export function AppProvider({ children, initial }: { children: React.ReactNode; initial?: Partial<State> }) {
  const [state, dispatch] = useReducer(appReducer, { me: null, sets: [], ...initial });
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
