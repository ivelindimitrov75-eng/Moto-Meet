import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { getErrorMessage } from "./lib/errorMessage";
import { useAuth } from "./AuthContext";
import AuthNavigation from "./AuthNavigation";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [eventTitles, setEventTitles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMyBookings() {
      if (!supabase || !user) {
        setErrorMessage("Your bookings are unavailable. Check the Supabase settings.");
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("event_bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const ids = [...new Set((data ?? []).map((booking) => booking.event_id))];
        let titles = {};
        if (ids.length > 0) {
          const { data: eventData, error: eventError } = await supabase
            .from("event_catalog")
            .select("id,title")
            .in("id", ids);
          if (eventError) throw eventError;
          titles = Object.fromEntries((eventData ?? []).map((event) => [event.id, event.title]));
        }
        if (isMounted) {
          setBookings(data ?? []);
          setEventTitles(titles);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(`We could not load your bookings: ${getErrorMessage(error)}`);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMyBookings();
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div className="site-shell events-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="MotoMeet home">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>MOTO<span className="brand-accent">MEET</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/events">Events</Link>
          <AuthNavigation />
        </nav>
      </header>
      <main className="events-main">
        <section className="events-intro">
          <p className="eyebrow"><span className="eyebrow-line" />YOUR PARTICIPATION</p>
          <h1>My <span>bookings.</span></h1>
          <p>Review your event bookings and manage your participation.</p>
        </section>

        {isLoading && <p role="status">Loading your bookings...</p>}
        {errorMessage && <p className="form-message error" role="alert">{errorMessage}</p>}
        {!isLoading && !errorMessage && bookings.length === 0 && (
          <p role="status">You have not booked an event yet. <Link to="/events">Browse the event catalog</Link>.</p>
        )}
        {bookings.length > 0 && (
          <section className="my-booking-list" aria-label="My event bookings">
            {bookings.map((booking) => (
              <article className="my-booking-card" key={booking.id}>
                <p className="event-type">{eventTitles[booking.event_id] ?? booking.event_id}</p>
                <h2>{booking.rider_name}</h2>
                <p>{booking.motorcycle_year ? `${booking.motorcycle_year} ` : ""}{booking.motorcycle_make} {booking.motorcycle_model}</p>
                <div className="my-booking-actions">
                  <Link className="button button-primary" to={`/events/${booking.event_id}`}>Manage booking</Link>
                  <Link className="text-button" to={`/participants/${booking.id}`}>View participant profile</Link>
                </div>
              </article>
            ))}
          </section>
        )}
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
