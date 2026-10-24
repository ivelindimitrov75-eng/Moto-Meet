import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const ridePhotos = [
  {
    src: "/images/track-ride.webp",
    alt: "A rider leaning into a turn on a race track at sunset",
    label: "The open road",
  },
  {
    src: "/images/bike-lineup.webp",
    alt: "A colourful line of motorcycles parked together",
    label: "Good company",
  },
  {
    src: "/images/motorcycle-event.webp",
    alt: "A busy town street filled with motorcycles at a riding event",
    label: "Meet up",
  },
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function App() {
  const [selectedPhoto, setSelectedPhoto] = useState(ridePhotos[0]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todos, setTodos] = useState([]);
  const [todosError, setTodosError] = useState("");
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function getTodos() {
      if (!supabase) {
        setTodosError(
          "Community updates are unavailable. Please check the Supabase settings.",
        );
        setIsLoadingTodos(false);
        return;
      }

      try {
        const { data, error } = await supabase.from("todos").select();

        if (!isMounted) return;

        if (error) {
          setTodosError(`We could not load community updates: ${error.message}`);
        } else {
          setTodos(data ?? []);
        }
      } catch (error) {
        if (!isMounted) return;

        setTodosError(
          `We could not load community updates: ${
            error instanceof Error ? error.message : "An unexpected error occurred."
          }`,
        );
      } finally {
        if (isMounted) setIsLoadingTodos(false);
      }
    }

    getTodos();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
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
      setMessage({
        type: "error",
        text: "Please enter a valid email address.",
      });
      return;
    }

    if (form.password.length < 6) {
      setMessage({
        type: "error",
        text: "Your password must have at least 6 characters.",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage({ type: "error", text: "The passwords do not match." });
      return;
    }

    if (!supabase) {
      setMessage({
        type: "error",
        text: "Account sign-up is not set up yet. Please check the Supabase settings.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: name },
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }

      setMessage({
        type: "success",
        text: data.session
          ? "Your account is ready. Welcome to MotoMeet!"
          : "Your account is started. Check your email to confirm it.",
      });
      setForm(emptyForm);
    } catch {
      setMessage({
        type: "error",
        text: "We could not connect. Please check your internet and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="MotoMeet home">
          <span className="brand-mark" aria-hidden="true">
            M
          </span>
          <span>
            MOTO<span className="brand-accent">MEET</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#ride">The ride</a>
          <a href="#community">The community</a>
          <a href="/events">Events</a>
          <a href="/login">Log in</a>
          <a className="nav-join" href="#join">
            Join us <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" id="ride">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-line" />
              MADE FOR THE RIDE
            </p>
            <h1>
              Find your people.
              <br />
              Find your <span>ride.</span>
            </h1>
            <p className="hero-description">
              Good roads are better together. Meet local riders, find your next
              ride-out, and make every weekend count.
            </p>
            <a className="button button-primary" href="#join">
              Join the ride <span aria-hidden="true">↗</span>
            </a>
            <div className="ride-note">
              <span className="ride-note-dot" />
              YOUR NEXT ADVENTURE STARTS HERE
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="hero-image"
              src={selectedPhoto.src}
              alt={selectedPhoto.alt}
            />
            <div className="photo-caption">
              <span>01 / 03</span>
              <span>{selectedPhoto.label}</span>
            </div>
            <div className="photo-picker" aria-label="Choose a ride photo">
              {ridePhotos.map((photo, index) => (
                <button
                  className={`photo-option${selectedPhoto.src === photo.src ? " is-selected" : ""}`}
                  key={photo.src}
                  type="button"
                  onClick={() => setSelectedPhoto(photo)}
                  aria-label={`Show photo: ${photo.label}`}
                  aria-pressed={selectedPhoto.src === photo.src}
                >
                  <img src={photo.src} alt="" />
                  <span>0{index + 1}</span>
                </button>
              ))}
            </div>
            <div className="image-stamp" aria-hidden="true">
              RIDE
              <br />
              TOGETHER
            </div>
          </div>
        </section>

        <section className="todos-section" aria-labelledby="todos-heading">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line" />
              FROM THE COMMUNITY
            </p>
            <h2 id="todos-heading">Community updates</h2>
          </div>
          {isLoadingTodos ? (
            <p role="status">Loading community updates...</p>
          ) : todosError ? (
            <p className="todos-message error" role="alert">
              {todosError}
            </p>
          ) : todos.length > 0 ? (
            <ul className="todos-list">
              {todos.map((todo) => (
                <li key={todo.id}>{todo.name}</li>
              ))}
            </ul>
          ) : (
            <p className="todos-message" role="status">
              There are no community updates yet.
            </p>
          )}
        </section>

        <section className="join-section" id="join">
          <div className="join-intro" id="community">
            <p className="eyebrow">
              <span className="eyebrow-line" />
              YOUR CREW IS OUT THERE
            </p>
            <h2>
              Miles are better
              <br />
              <span>shared.</span>
            </h2>
            <p>
              Sign up and start meeting riders who love the open road as much
              as you do.
            </p>
            <div className="join-photo">
              <img
                src="/images/motorcycle-event.webp"
                alt="Riders gather for a motorcycle event in town"
                loading="lazy"
              />
              <span>FIND YOUR NEXT MEET-UP</span>
            </div>
          </div>

          <div className="form-card">
            <div className="form-heading">
              <span className="form-step">01 / CREATE YOUR ACCOUNT</span>
              <h2>Join the crew</h2>
              <p>Start with the basics. The road comes next.</p>
            </div>
            <form className="register-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="name">Your name</label>
              <input
                autoComplete="name"
                id="name"
                name="name"
                onChange={handleChange}
                placeholder="e.g. Alex Rider"
                required
                value={form.name}
              />

              <label htmlFor="email">Email address</label>
              <input
                autoComplete="email"
                id="email"
                name="email"
                onChange={handleChange}
                placeholder="you@example.com"
                required
                type="email"
                value={form.email}
              />

              <div className="form-row">
                <div>
                  <label htmlFor="password">Password</label>
                  <input
                    autoComplete="new-password"
                    id="password"
                    minLength={6}
                    name="password"
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    required
                    type="password"
                    value={form.password}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword">Repeat password</label>
                  <input
                    autoComplete="new-password"
                    id="confirmPassword"
                    name="confirmPassword"
                    onChange={handleChange}
                    placeholder="Type it again"
                    required
                    type="password"
                    value={form.confirmPassword}
                  />
                </div>
              </div>

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
                {isSubmitting ? "Creating your account..." : "Create my account"}
                {!isSubmitting && <span aria-hidden="true">↗</span>}
              </button>
              <p className="form-smallprint">
                By joining, you agree to ride safe and look out for each other.
              </p>
            </form>
            <p className="form-smallprint signup-login-link">
              Already part of the crew? <a href="/login">Log in</a>
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            M
          </span>
          <span>
            MOTO<span className="brand-accent">MEET</span>
          </span>
        </a>
        <p>Good roads. Good people. More stories to tell.</p>
        <span className="footer-year">MADE FOR RIDERS</span>
      </footer>
    </div>
  );
}
