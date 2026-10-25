import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AuthNavigation({ hideWhenSignedOut = false }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setErrorMessage("");
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.assign("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Could not log out: ${error.message}`
          : "Could not log out because of an unexpected error.",
      );
    }
  }

  return (
    <>
      {isSignedIn ? (
        <button className="nav-logout" type="button" onClick={handleSignOut}>
          Log out
        </button>
      ) : !hideWhenSignedOut ? (
        <a href="/login">Log in</a>
      ) : null}
      {errorMessage && (
        <span className="nav-auth-error" role="alert">
          {errorMessage}
        </span>
      )}
    </>
  );
}
