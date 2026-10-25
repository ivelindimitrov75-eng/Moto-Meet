import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { useAuth } from "./AuthContext";

export default function AuthNavigation({ hideWhenSignedOut = false }) {
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  async function handleSignOut() {
    setErrorMessage("");
    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
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
      {user ? (
        <button className="nav-logout" type="button" onClick={handleSignOut}>
          Log out
        </button>
      ) : !hideWhenSignedOut ? (
        <Link to="/login">Log in</Link>
      ) : null}
      {errorMessage && (
        <span className="nav-auth-error" role="alert">
          {errorMessage}
        </span>
      )}
    </>
  );
}
