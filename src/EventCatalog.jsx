import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { getErrorMessage } from "./lib/errorMessage";
import { useAuth } from "./AuthContext";
import AuthNavigation from "./AuthNavigation";

export default function EventCatalog() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      if (!supabase) {
        setErrorMessage("The event catalog is unavailable. Check the Supabase settings.");
        setIsLoading(false);
        return;
      }

      try {
        const [{ data: eventData, error: eventError }, { data: bookingData, error: bookingError }] =
          await Promise.all([
            supabase.from("event_catalog").select("*").order("title"),
            supabase.from("public_event_bookings").select("event_id"),
          ]);
        if (eventError) throw eventError;
        if (bookingError) throw bookingError;

        const counts = {};
        for (const booking of bookingData ?? []) {
          counts[booking.event_id] = (counts[booking.event_id] ?? 0) + 1;
        }
        if (isMounted) {
          setEvents(eventData ?? []);
          setParticipantCounts(counts);
        }
      } catch (error) {
        if (isMounted) {
          const detail = getErrorMessage(error);
          setErrorMessage(
            /event_catalog/i.test(detail) && /not found|schema cache|does not exist/i.test(detail)
              ? "The event catalog table is missing. Apply supabase/migrations/20261026000000_event_catalog.sql in the Supabase SQL Editor."
              : `We could not load events: ${detail}`,
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="site-shell events-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="MotoMeet home">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>MOTO<span className="brand-accent">MEET</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link to="/">Home</Link>
          {user && <Link to="/my-bookings">My bookings</Link>}
          <AuthNavigation />
        </nav>
      </header>
      <main className="events-main">
        <section className="events-intro">
          <p className="eyebrow"><span className="eyebrow-line" />FIND YOUR NEXT RIDE</p>
          <h1>Upcoming <span>events.</span></h1>
          <p>Explore the meetups, rides, and events riders are joining.</p>
        </section>

        {isLoading && <p role="status">Loading events...</p>}
        {errorMessage && <p className="form-message error" role="alert">{errorMessage}</p>}
        {!isLoading && !errorMessage && events.length === 0 && (
          <p role="status">There are no events to show yet.</p>
        )}

        <section className="events-grid" aria-label="Event catalog">
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <img className="event-image" src={event.image} alt={event.alt} />
              <div className="event-card-content">
                <p className="event-type">{event.type}</p>
                <h2>{event.title}</h2>
                <p className="event-description">{event.description}</p>
                <p className="event-participant-count">
                  {participantCounts[event.id] ?? 0} participants
                </p>
                <Link className="button button-primary event-book-button" to={`/events/${event.id}`}>
                  View event <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
      <footer className="site-footer">
        <Link className="brand footer-brand" to="/">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>MOTO<span className="brand-accent">MEET</span></span>
        </Link>
        <p>Good roads are better together.</p>
        <span className="footer-year">MOTOMEET</span>
      </footer>
    </div>
  );
}
