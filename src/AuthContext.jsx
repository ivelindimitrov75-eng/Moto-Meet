import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;

    let isMounted = true;
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession);
        setAuthError("");
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: sessionData, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error("Could not restore the Supabase session:", error);
        setSession(null);
        setAuthError(error.message);
      } else {
        setSession(sessionData.session);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, isLoading, authError }),
    [session, isLoading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}
