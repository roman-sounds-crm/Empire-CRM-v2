import { AutumnProvider } from "autumn-js/react";

interface ProviderProps {
  children: React.ReactNode;
}

export function Provider({ children }: ProviderProps) {
  return <AutumnProvider useBetterAuth>{children}</AutumnProvider>;
}
