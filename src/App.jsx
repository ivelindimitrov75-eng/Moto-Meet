import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./lib/supabase";
import AuthNavigation from "./AuthNavigation";
import { useAuth } from "./AuthContext";

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

export default function App() {
  const [selectedPhoto, setSelectedPhoto] = useState(ridePhotos[0]);
  const [todos, setTodos] = useState([]);
  const [todosError, setTodosError] = useState("");
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const { user } = useAuth();

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
          <Link to="/events">Events</Link>
          {user && <Link to="/my-bookings">My bookings</Link>}
          <AuthNavigation />
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
            {user ? (
              <Link className="button button-primary" to="/events">Explore events <span aria-hidden="true">↗</span></Link>
            ) : (
              <Link className="button button-primary" to="/register">Join the ride <span aria-hidden="true">↗</span></Link>
            )}
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
              {user
                ? "Your next ride is waiting. Browse events and meet riders nearby."
                : "Sign up and start meeting riders who love the open road as much as you do."}
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

          {user ? (
            <div className="form-card form-heading">
              <span className="form-step">READY FOR YOUR NEXT RIDE?</span>
              <h2>Welcome back</h2>
              <p>Your crew and upcoming meet-ups are waiting.</p>
              <Link className="button button-primary submit-button" to="/events">Browse events <span aria-hidden="true">↗</span></Link>
              <Link className="text-button" to="/my-bookings">Manage my bookings</Link>
            </div>
          ) : (
            <div className="form-card form-heading">
              <span className="form-step">01 / CREATE YOUR ACCOUNT</span>
              <h2>Join the crew</h2>
              <p>Start with the basics. The road comes next.</p>
              <Link className="button button-primary submit-button" to="/register">Create your account <span aria-hidden="true">↗</span></Link>
              <p className="form-smallprint signup-login-link">Already part of the crew? <Link to="/login">Log in</Link></p>
            </div>
          )}
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
