"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * Redux store provider.
 * Must be a client component — wrap this around the app in a server layout.
 */
export function StoreProvider({ children }: StoreProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
