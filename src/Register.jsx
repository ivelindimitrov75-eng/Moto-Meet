import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import AuthNavigation from "./AuthNavigation";

const emptyForm = { name: "", email: "", password: "", confirmPassword: "" };

export default function Register() {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage({ type: "", text: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    const name = form.name.trim();
    if (name.length < 2) {
      setMessage({ type: "error", text: "Please enter your name." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    if (form.password.length < 6) {
      setMessage({ type: "error", text: "Your password must have at least 6 characters." });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "The passwords do not match." });
      return;
    }
    if (!supabase) {
      setMessage({ type: "error", text: "Account sign-up is not set up. Check the Supabase settings." });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      navigate("/login?registered=1");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error
          ? `We could not create your account: ${error.message}`
          : "We could not create your account because of an unexpected error.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page register-page">
      <div className="login-topbar">
        <Link className="brand login-brand" to="/" aria-label="MotoMeet home">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>MOTO<span className="brand-accent">MEET</span></span>
        </Link>
        <AuthNavigation hideWhenSignedOut />
      </div>
      <section className="form-card register-card" aria-labelledby="register-heading">
        <div className="form-heading">
          <span className="form-step">01 / CREATE YOUR ACCOUNT</span>
          <h1 id="register-heading">Join the crew</h1>
          <p>Start with the basics. The road comes next.</p>
        </div>
        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="register-name">Your name</label>
          <input id="register-name" name="name" autoComplete="name" required value={form.name} onChange={handleChange} placeholder="e.g. Alex Rider" />
          <label htmlFor="register-email">Email address</label>
          <input id="register-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
          <div className="form-row">
            <div>
              <label htmlFor="register-password">Password</label>
              <input id="register-password" name="password" type="password" autoComplete="new-password" minLength={6} required value={form.password} onChange={handleChange} placeholder="At least 6 characters" />
            </div>
            <div>
              <label htmlFor="register-confirm">Repeat password</label>
              <input id="register-confirm" name="confirmPassword" type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={handleChange} placeholder="Type it again" />
            </div>
          </div>
          {message.text && <p className={`form-message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
          <button className="button button-primary submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating your account..." : "Create my account"}
            {!isSubmitting && <span aria-hidden="true">↗</span>}
          </button>
          <p className="form-smallprint">By joining, you agree to ride safe and look out for each other.</p>
        </form>
        <p className="form-smallprint signup-login-link">Already part of the crew? <Link to="/login">Log in</Link></p>
      </section>
    </main>
  );
}
