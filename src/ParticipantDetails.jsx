import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { getErrorMessage } from "./lib/errorMessage";
import { useAuth } from "./AuthContext";
import AuthNavigation from "./AuthNavigation";

export default function ParticipantDetails() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadParticipant() {
      if (!supabase) {
        setErrorMessage("Participant details are unavailable. Check the Supabase settings.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setErrorMessage("");
      setBooking(null);

      try {
        const { data: participant, error: participantError } = await supabase
          .from("public_event_bookings")
          .select("*")
          .eq("id", bookingId)
          .maybeSingle();
        if (participantError) throw participantError;
        if (!participant) return;

        const [{ data: event, error: eventError }, { data: ownBooking, error: ownError }] =
          await Promise.all([
            supabase.from("event_catalog").select("title").eq("id", participant.event_id).maybeSingle(),
            user
              ? supabase.from("event_bookings").select("email").eq("id", bookingId).maybeSingle()
              : Promise.resolve({ data: null, error: null }),
          ]);
        if (eventError) throw eventError;
        if (ownError) throw ownError;
        if (isMounted) {
          setBooking({ ...participant, email: ownBooking?.email ?? null });
          setEventTitle(event?.title ?? "Event");
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(`We could not load participant details: ${getErrorMessage(error)}`);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadParticipant();
    return () => {
      isMounted = false;
    };
  }, [bookingId, user]);

  const photoUrl = booking?.photo_path
    ? supabase.storage.from("motorcycle-photos").getPublicUrl(booking.photo_path).data.publicUrl
    : "";

  return (
    <div className="site-shell events-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="MotoMeet home">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>MOTO<span className="brand-accent">MEET</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link to="/events">Events</Link>
          {user && <Link to="/my-bookings">My bookings</Link>}
          <AuthNavigation />
        </nav>
      </header>
      <main className="events-main participant-main">
        <section className="events-intro">
          <p className="eyebrow"><span className="eyebrow-line" />RIDER PROFILE</p>
          <h1>{booking ? booking.rider_name : "Participant details"}</h1>
          {booking && <p>Joining <Link to={`/events/${booking.event_id}`}>{eventTitle}</Link></p>}
        </section>

        {isLoading && <p role="status">Loading participant details...</p>}
        {errorMessage && <p className="form-message error" role="alert">{errorMessage}</p>}
        {!isLoading && !errorMessage && !booking && <p role="status">This participant could not be found.</p>}
        {booking && (
          <article className="participant-card">
            {photoUrl && (
              <img
                className="participant-photo"
                src={photoUrl}
                alt={`${booking.motorcycle_make} ${booking.motorcycle_model}`}
              />
            )}
            <div>
              <p className="event-type">{eventTitle}</p>
              <h2>{booking.rider_name}</h2>
              <p className="participant-bike">
                {booking.motorcycle_year ? `${booking.motorcycle_year} ` : ""}
                {booking.motorcycle_make} {booking.motorcycle_model}
              </p>
              {booking.email && <p>{booking.email}</p>}
              <Link className="button button-primary" to={`/events/${booking.event_id}`}>Back to event</Link>
            </div>
          </article>
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
