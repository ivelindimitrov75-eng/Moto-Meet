import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function CheckingSession() {
  return <p className="route-status" role="status">Checking your session...</p>;
}

function SessionError({ message }) {
  return (
    <main className="route-status">
      <p className="form-message error" role="alert">
        We could not restore your sign-in session: {message}
      </p>
      <button className="button button-primary" type="button" onClick={() => window.location.reload()}>
        Try again
      </button>
    </main>
  );
}

export function RequireAuth() {
  const { user, isLoading, authError } = useAuth();
  const location = useLocation();

  if (isLoading) return <CheckingSession />;
  if (authError) return <SessionError message={authError} />;
  return user
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />;
}

export function GuestOnly() {
  const { user, isLoading, authError } = useAuth();

  if (isLoading) return <CheckingSession />;
  if (authError) return <SessionError message={authError} />;
  return user ? <Navigate to="/events" replace /> : <Outlet />;
}
