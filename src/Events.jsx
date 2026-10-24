import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const PHOTO_BUCKET = "motorcycle-photos";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const events = [
  {
    id: "cafe",
    type: "CAFE MEETUP",
    title: "Coffee & Chrome",
    description: "A relaxed meetup for good coffee and stories from the road.",
    image: "/images/event-cafe.jpg",
    alt: "Motorcycles inside a motorcycle cafe",
  },
  {
    id: "concert",
    type: "LIVE CONCERT",
    title: "Moto Night Live",
    description: "Meet up with riders for a night of live music and engines.",
    image: "/images/event-concert.jpg",
    alt: "A motorcycle at a live music concert",
  },
  {
    id: "tour",
    type: "SCENIC TOUR",
    title: "Open Road Escape",
    description: "Pack your riding gear for a scenic motorcycle tour and campout.",
    image: "/images/event-tour.webp",
    alt: "A touring motorcycle parked beside a tent in the mountains",
  },
];

const blankForm = {
  rider_name: "",
  email: "",
  motorcycle_make: "",
  motorcycle_model: "",
  motorcycle_year: "",
};

function getSupabaseErrorMessage(error, fallback) {
  const detail =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "";
  const code =
    error && typeof error === "object" && "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";

  if (
    code === "PGRST205" ||
    (detail.includes("event_bookings") &&
      /not found|does not exist|schema cache/i.test(detail))
  ) {
    return "The event_bookings table is missing. Run supabase/migrations/20261024000000_event_bookings.sql in your Supabase SQL Editor.";
  }

  if (/bucket not found/i.test(detail)) {
    return "The motorcycle-photos storage bucket is missing. Run supabase/migrations/20261024000000_event_bookings.sql in your Supabase SQL Editor.";
  }

  return detail || fallback;
}

export default function Events() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState({});
  const [photoUrls, setPhotoUrls] = useState({});
  const [form, setForm] = useState(blankForm);
  const [photo, setPhoto] = useState(null);
  const [activeEvent, setActiveEvent] = useState("");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [pageError, setPageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBookings() {
      if (!supabase) {
        setPageError("Event bookings are unavailable. Please check the Supabase settings.");
        setIsLoading(false);
        return;
      }

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const currentUser = userData.user;
        if (isMounted) setUser(currentUser);

        const { data: publicData, error } = await supabase
          .from("public_event_bookings")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) throw error;

        let ownBookings = [];
        if (currentUser) {
          const { data, error: ownBookingsError } = await supabase
            .from("event_bookings")
            .select("*")
            .eq("user_id", currentUser.id);
          if (ownBookingsError) throw ownBookingsError;
          ownBookings = data ?? [];
        }
        const ownBookingMap = new Map(
          ownBookings.map((booking) => [booking.id, booking]),
        );
        const bookingMap = {};
        const urls = {};
        for (const booking of publicData ?? []) {
          const ownBooking = ownBookingMap.get(booking.id);
          const visibleBooking = ownBooking
            ? { ...booking, email: ownBooking.email, is_owner: true }
            : { ...booking, is_owner: false };
          bookingMap[booking.event_id] ??= [];
          bookingMap[booking.event_id].push(visibleBooking);
          if (booking.photo_path) {
            urls[booking.id] = supabase.storage
              .from(PHOTO_BUCKET)
              .getPublicUrl(booking.photo_path).data.publicUrl;
          }
        }
        if (isMounted) {
          setBookings(bookingMap);
          setPhotoUrls(urls);
        }
      } catch (error) {
        if (isMounted) {
          setPageError(
            `We could not load event bookings: ${getSupabaseErrorMessage(
              error,
              "An unexpected error occurred.",
            )}`,
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBookings();
    return () => {
      isMounted = false;
    };
  }, []);

  function openForm(eventId, booking = null) {
    setActiveEvent(eventId);
    setEditing(Boolean(booking));
    setPhoto(null);
    setMessage({ type: "", text: "" });
    setForm(
      booking
        ? {
            rider_name: booking.rider_name,
            email: booking.email,
            motorcycle_make: booking.motorcycle_make,
            motorcycle_model: booking.motorcycle_model,
            motorcycle_year: booking.motorcycle_year ?? "",
          }
        : {
            ...blankForm,
            rider_name: user?.user_metadata?.full_name ?? "",
            email: user?.email ?? "",
          },
    );
  }

  function closeForm() {
    setActiveEvent("");
    setPhoto(null);
    setMessage({ type: "", text: "" });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage({ type: "", text: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    if (!supabase || !user) return;

    if (!form.rider_name.trim() || !form.email.trim() || !form.motorcycle_make.trim() || !form.motorcycle_model.trim()) {
      setMessage({ type: "error", text: "Please fill in your name, email, motorcycle make, and model." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    if (
      photo &&
      (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(photo.type) ||
        photo.size > MAX_PHOTO_SIZE)
    ) {
      setMessage({ type: "error", text: "Choose a JPG, PNG, WebP, or GIF image smaller than 5 MB." });
      return;
    }

    setIsSaving(true);
    let uploadedPath = "";
    let uploadedPhotoUrl = "";
    const currentBooking = (bookings[activeEvent] ?? []).find(
      (booking) => booking.is_owner,
    );

    try {
      if (photo) {
        const extension = photo.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
        uploadedPath = `${user.id}/${activeEvent}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(uploadedPath, photo, { contentType: photo.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data: signedPhoto, error: signedUrlError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .createSignedUrl(uploadedPath, 3600);
        if (signedUrlError) throw signedUrlError;
        uploadedPhotoUrl = signedPhoto.signedUrl;
      }

      const record = {
        user_id: user.id,
        event_id: activeEvent,
        rider_name: form.rider_name.trim(),
        email: form.email.trim(),
        motorcycle_make: form.motorcycle_make.trim(),
        motorcycle_model: form.motorcycle_model.trim(),
        motorcycle_year: form.motorcycle_year ? Number(form.motorcycle_year) : null,
        photo_path: uploadedPath || currentBooking?.photo_path || null,
      };
      const { data, error } = await supabase
        .from("event_bookings")
        .upsert(record, { onConflict: "user_id,event_id" })
        .select()
        .single();
      if (error) throw error;

      let photoWarning = "";
      if (uploadedPath && currentBooking?.photo_path) {
        const { error: removeError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .remove([currentBooking.photo_path]);
        if (removeError) photoWarning = ` Your previous photo could not be removed: ${removeError.message}`;
      }
      const nextBookings = { ...bookings };
      nextBookings[activeEvent] = currentBooking
        ? (bookings[activeEvent] ?? []).map((booking) =>
            booking.id === data.id
              ? { ...data, ...record, is_owner: true }
              : booking,
          )
        : [...(bookings[activeEvent] ?? []), { ...data, ...record, is_owner: true }];
      const nextUrls = { ...photoUrls };
      if (uploadedPhotoUrl) nextUrls[data.id] = uploadedPhotoUrl;
      setBookings(nextBookings);
      setPhotoUrls(nextUrls);
      closeForm();
      setMessage({
        type: photoWarning ? "error" : "success",
        text: photoWarning || "Your event booking has been saved.",
      });
    } catch (error) {
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .remove([uploadedPath]);
        if (cleanupError) {
          setMessage({
            type: "error",
            text: `${getSupabaseErrorMessage(error, "Could not save your booking.")} The uploaded photo could not be cleaned up: ${getSupabaseErrorMessage(cleanupError, "Cleanup failed.")}`,
          });
          setIsSaving(false);
          return;
        }
      }
      setMessage({
        type: "error",
        text: getSupabaseErrorMessage(error, "Could not save your booking."),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteBooking(eventId, booking) {
    if (!supabase) return;
    if (!booking) return;
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const { error } = await supabase
        .from("event_bookings")
        .delete()
        .eq("id", booking.id);
      if (error) throw error;
      setBookings((current) => {
        const next = { ...current };
        next[eventId] = (current[eventId] ?? []).filter(
          (item) => item.id !== booking.id,
        );
        return next;
      });
      setPhotoUrls((current) => {
        const next = { ...current };
        delete next[booking.id];
        return next;
      });
      if (booking.photo_path) {
        const { error: removeError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .remove([booking.photo_path]);
        if (removeError) {
          setMessage({
            type: "error",
            text: `Your booking was deleted, but its motorcycle photo could not be removed: ${removeError.message}`,
          });
          return;
        }
      }
      setMessage({ type: "success", text: "Your event booking has been deleted." });
    } catch (error) {
      setMessage({
        type: "error",
        text: getSupabaseErrorMessage(error, "Could not delete your booking."),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="site-shell events-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="MotoMeet home">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>MOTO<span className="brand-accent">MEET</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/login">Log in</a>
        </nav>
      </header>
      <main className="events-main">
        <section className="events-intro">
          <p className="eyebrow"><span className="eyebrow-line" />THE NEXT RIDE IS YOURS</p>
          <h1>Meet up. <span>Ride out.</span></h1>
          <p>Pick an event and tell us a little about you and your motorcycle.</p>
        </section>

        {pageError && <p className="form-message error" role="alert">{pageError}</p>}
        {!pageError && isLoading && <p role="status">Loading your event bookings...</p>}
        {!pageError && !isLoading && !user && (
          <p className="form-message error" role="status">
            Anyone can view event bookings. <a href="/login">Sign in</a> to book an event or manage your own participation.
          </p>
        )}
        {message.text && <p className={`form-message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}

        <section className="events-grid" aria-label="Upcoming motorcycle events">
          {events.map((item) => {
            const eventBookings = bookings[item.id] ?? [];
            const ownBooking = eventBookings.find(
              (booking) => booking.is_owner,
            );
            return (
              <article className="event-card" key={item.id}>
                <img className="event-image" src={item.image} alt={item.alt} />
                <div className="event-card-content">
                  <p className="event-type">{item.type}</p>
                  <h2>{item.title}</h2>
                  <p className="event-description">{item.description}</p>
                  {eventBookings.map((booking) => (
                    <div className="booking-details" key={booking.id}>
                      {photoUrls[booking.id] && <img className="motorcycle-photo" src={photoUrls[booking.id]} alt={`${booking.motorcycle_make} ${booking.motorcycle_model}`} />}
                      <p><strong>{booking.rider_name}</strong> · {booking.motorcycle_year ? `${booking.motorcycle_year} ` : ""}{booking.motorcycle_make} {booking.motorcycle_model}</p>
                      {booking.is_owner && (
                        <div className="booking-actions">
                          <button className="button button-primary" type="button" onClick={() => openForm(item.id, booking)}>Edit booking</button>
                          <button className="text-button" type="button" disabled={isSaving} onClick={() => deleteBooking(item.id, booking)}>Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {user && !ownBooking && !isLoading ? (
                    <button className="button button-primary event-book-button" type="button" onClick={() => openForm(item.id)}>Book this event <span aria-hidden="true">↗</span></button>
                  ) : null}

                  {activeEvent === item.id && (
                    <form className="register-form event-form" onSubmit={handleSubmit}>
                      <h3>{editing ? "Edit your participation" : "Your booking details"}</h3>
                      <label htmlFor={`${item.id}-rider`}>Your name</label>
                      <input id={`${item.id}-rider`} name="rider_name" autoComplete="name" required value={form.rider_name} onChange={handleChange} />
                      <label htmlFor={`${item.id}-email`}>Email address</label>
                      <input id={`${item.id}-email`} name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} />
                      <label htmlFor={`${item.id}-make`}>Motorcycle make</label>
                      <input id={`${item.id}-make`} name="motorcycle_make" required placeholder="e.g. Honda" value={form.motorcycle_make} onChange={handleChange} />
                      <label htmlFor={`${item.id}-model`}>Motorcycle model</label>
                      <input id={`${item.id}-model`} name="motorcycle_model" required placeholder="e.g. CB500" value={form.motorcycle_model} onChange={handleChange} />
                      <label htmlFor={`${item.id}-year`}>Year (optional)</label>
                      <input id={`${item.id}-year`} name="motorcycle_year" type="number" min="1885" max={new Date().getFullYear() + 1} value={form.motorcycle_year} onChange={handleChange} />
                      <label htmlFor={`${item.id}-photo`}>Motorcycle photo (optional, max 5 MB)</label>
                      <input id={`${item.id}-photo`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
                      {ownBooking?.photo_path && <p className="form-smallprint">Choose a new photo to replace your current one.</p>}
                      {message.text && <p className={`form-message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
                      <button className="button button-primary submit-button" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editing ? "Save changes" : "Confirm booking"}</button>
                      <button className="text-button" type="button" onClick={closeForm}>Cancel</button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>
      <footer className="site-footer">
        <a className="brand footer-brand" href="/">
          <span className="brand-mark" aria-hidden="true">M</span>
          <span>MOTO<span className="brand-accent">MEET</span></span>
        </a>
        <p>Good roads are better together.</p>
        <span className="footer-year">MOTOMEET</span>
      </footer>
    </div>
  );
}
