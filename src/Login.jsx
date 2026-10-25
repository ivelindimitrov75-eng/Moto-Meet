import { useState } from "react";
import { supabase } from "./lib/supabase";
import AuthNavigation from "./AuthNavigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(() =>
    new URLSearchParams(window.location.search).has("registered")
      ? {
          type: "success",
          text: "Your account is registered. Sign in to continue to events.",
        }
      : { type: "", text: "" },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!supabase) {
      setMessage({
        type: "error",
        text: "Sign-in is not set up yet. Please check the Supabase settings.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }

      window.location.assign("/events");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? `We could not sign you in: ${error.message}`
            : "We could not sign you in because of an unexpected error.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-topbar">
        <a className="brand login-brand" href="/" aria-label="MotoMeet home">
          <span className="brand-mark" aria-hidden="true">
            M
          </span>
          <span>
            MOTO<span className="brand-accent">MEET</span>
          </span>
        </a>
        <AuthNavigation hideWhenSignedOut />
      </div>

      <section className="login-layout" aria-labelledby="login-heading">
        <div className="login-photo">
          <img
            src="/images/login-casino.png"
            alt="A blue motorcycle parked in front of a sunlit hotel"
          />
          <div className="login-photo-caption">
            <p className="eyebrow">
              <span className="eyebrow-line" />
              GOOD ROADS. GOOD PEOPLE.
            </p>
            <p>Every ride starts with coming together.</p>
          </div>
        </div>

        <div className="form-card login-card">
          <div className="form-heading">
            <span className="form-step">02 / WELCOME BACK</span>
            <h1 id="login-heading">Ride again</h1>
            <p>Sign in to get back to your MotoMeet crew.</p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>
            <input
              autoComplete="email"
              id="login-email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />

            <label htmlFor="login-password">Password</label>
            <input
              autoComplete="current-password"
              id="login-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              type="password"
              value={password}
            />

            {message.text && (
              <p
                className={`form-message ${message.type}`}
                role={message.type === "error" ? "alert" : "status"}
              >
                {message.text}
              </p>
            )}

            <button
              className="button button-primary submit-button"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Signing you in..." : "Sign in"}
              {!isSubmitting && <span aria-hidden="true">↗</span>}
            </button>
            <p className="form-smallprint login-signup-link">
              New to the crew? <a href="/#join">Create an account</a>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
