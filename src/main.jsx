import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext.jsx";
import { GuestOnly, RequireAuth } from "./RouteGuards.jsx";
import "./styles.css";

const App = lazy(() => import("./App.jsx"));
const EventCatalog = lazy(() => import("./EventCatalog.jsx"));
const Events = lazy(() => import("./Events.jsx"));
const Login = lazy(() => import("./Login.jsx"));
const MyBookings = lazy(() => import("./MyBookings.jsx"));
const ParticipantDetails = lazy(() => import("./ParticipantDetails.jsx"));
const Register = lazy(() => import("./Register.jsx"));

function NotFound() {
  return (
    <main className="route-status">
      <h1>Page not found</h1>
      <p>That page is not part of MotoMeet.</p>
      <Link to="/">Return home</Link>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<p className="route-status" role="status">Loading MotoMeet...</p>}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/events" element={<EventCatalog />} />
            <Route path="/events/:eventId" element={<Events />} />
            <Route path="/participants/:bookingId" element={<ParticipantDetails />} />
            <Route element={<GuestOnly />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="/my-bookings" element={<MyBookings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
