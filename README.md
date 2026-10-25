# MotoMeet

MotoMeet helps motorcycle riders discover local meetups, meet other riders,
and manage their event bookings. Riders can create, edit, and delete only
their own bookings. The React single-page application uses Supabase for
authentication, database storage, and motorcycle photo storage.

## Project history

This section preserves the implementation notes from the previous README and
updates them to reflect the current application.

## Public link

https://moto-meet-flax.vercel.app


### Step 1: Home page and account registration

- Created the MotoMeet home page with a dark and orange visual style and
  motorcycle photography.
- Added selectable motorcycle photos for the home-page hero image.
- Added account registration with name, email, password, and password
  confirmation fields.
- Added validation and success/error feedback for registration.
- Added community updates loaded from the Supabase `todos` table.

### Step 2: Sign-in

- Added a login page that signs riders in with their email and password using
  Supabase Auth.
- Added clear sign-in success and error handling.
- Added links between account creation and sign-in.
- Added a motorcycle image and responsive styling to the login page.

### Step 3: Motorcycle event bookings

- Added cafe meetup, live concert, and scenic tour events.
- Added event bookings for signed-in riders, with rider name, email, motorcycle
  make/model, and optional year.
- Added the ability for riders to edit or delete their own bookings.
- Connected registration and sign-in to the event-booking flow.

### Step 4: Participant information and motorcycle photos

- Made participant names, motorcycle details, and uploaded motorcycle photos
  visible on event pages.
- Restricted booking changes to the booking owner using Supabase Auth and
  row-level security; participant email addresses remain private to the owner.
- Added optional motorcycle photo uploads, limited to 5 MB.

### Step 5: Event layout and logout

- Positioned the **Book this event** action below the event description.
- Displayed participants as a vertical list with motorcycle photos, names, and
  motorcycle details.
- Added a sign-out button for signed-in riders and a sign-in link for guests.
- Added visible feedback if signing out fails.

### Step 6: Catalog, protected pages, and administration

- Added a Supabase-backed event catalog, parameterized event detail and
  participant profile pages, and a private **My bookings** page.
- Added shared authentication state and guest-only, authenticated, and admin
  route guards.
- Enforced author-only booking edits and deletions in the interface and with
  Supabase row-level security policies.

## Run locally

### Requirements

- Node.js 20.19+ or 22.12+
- A Supabase project

### Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and enter the Supabase project URL and
   publishable key:

   ```text
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

   The browser app needs only the public publishable key. Never place a
   Supabase service-role key in frontend code or a `VITE_` variable.

3. In the Supabase Dashboard, open **SQL Editor** and run the files in
   `supabase/migrations` in date order:

   - `20261024000000_event_bookings.sql`
   - `20261025000000_admin_event_management.sql`
   - `20261026000000_event_catalog.sql`
   - `20261027000000_community_updates.sql`
   - `20261028000000_enforce_booking_ownership.sql`

4. Start the development server:

   ```sh
   npm run dev
   ```

   Vite prints the local URL, normally `http://localhost:5173`.

5. Create a production build with `npm run build`. Preview it locally with
   `npm run preview`.

## Functional Guide

### 1. Project overview

**Application name:** MotoMeet

**Category:** Motorcycle event discovery and booking
**Purpose:** Riders can browse motorcycle meetups, see participant and bike
details, and book a place. Registered riders can manage their own participation;
administrators can manage all bookings.

### 2. User access and permissions

**Guests**

- Can view the home page, event catalog, event details, and participant profiles.
- Can register or sign in.
- Cannot create, change, or delete bookings, or visit private account pages.

**Authenticated riders**

- Can browse public event and participant pages.
- Can create one booking per event and edit or delete their own booking.
- Can view their private bookings page.
- Cannot edit or delete another rider's booking.

### 3. Authentication and session handling

- Registration creates a Supabase Auth account with the rider's name stored as
  user metadata.
- The login page signs in with email and password. After a successful login,
  the rider returns to the protected page they requested, or to the event
  catalog by default.
- `AuthProvider` in `src/AuthContext.jsx` restores the Supabase session and
  shares the current session, user, and loading state across the React app.
- Supabase persists the session in the browser. Refreshing a page restores it
  through `getSession`.
- Logging out clears the Supabase session and returns the rider home.
- Logged-in users are redirected away from the login and registration pages.

### 4. Routing and route guards

The app uses React Router for client-side navigation:

| Route | Page | Access |
|---|---|---|
| `/` | Home, community updates, and event signup links | Public |
| `/events` | Event catalog | Public |
| `/events/:eventId` | Event details, participants, and booking actions | Public; booking actions require sign-in |
| `/participants/:bookingId` | A participant's public profile | Public |
| `/login` | Sign in | Guests only |
| `/register` | Create an account | Guests only |
| `/my-bookings` | The signed-in rider's bookings | Authenticated |
The event detail and participant profile routes use URL parameters. Guests can
read the catalog and detail pages; `RequireAuth` and `GuestOnly` in
`src/RouteGuards.jsx` protect functional/private routes.
Direct URL navigation and refreshes are supported by the SPA fallback rules
for Netlify and Vercel.

### 5. Catalog and details flow

- `/events` reads the event catalog from the Supabase `event_catalog` table and
  shows participant counts.
- Selecting **View event** opens `/events/:eventId`, which fetches the selected
  event and its public participant list.
- Selecting a participant opens `/participants/:bookingId` and loads that
  rider's public name and motorcycle details. Email addresses are not exposed
  by the public participant view.
- Riders can use the event page to book or manage their own participation.

### 6. Data source and backend

Supabase is the hosted backend-as-a-service. Supabase Auth manages accounts,
Postgres stores the event catalog and bookings, and Supabase Storage stores
motorcycle photos. This project does not require a separately hosted custom
API server. Booking and catalog data are fetched from Supabase and persist
between visits.

### 7. Data operations (CRUD)

The `event_bookings` collection supports all four operations:

- **Create:** A signed-in rider submits a booking on an event detail page.
  Supabase upserts one booking per rider and event.
- **Read:** The event catalog and participant list are public; a signed-in
  rider's private booking data is fetched for ownership controls. `/my-bookings`
  lists only that rider's bookings.
- **Update:** Riders edit their own booking from the event detail page.
- **Delete:** Riders can delete their own booking from the event detail page.

Postgres row-level security policies enforce booking ownership independently
of the UI. Storage policies also protect photo uploads and removals.

### 8. Forms and validation

Forms include account registration, sign-in, and rider event booking/editing.

- **Name:** Required; registration requires at least two characters.
- **Email:** Required and checked for a valid email format.
- **Password:** Required and at least six characters; registration also checks
  the repeated password.
- **Motorcycle make and model:** Required for an event booking.
- **Motorcycle year:** Optional, with a reasonable numeric year range.
- **Motorcycle photo:** Optional; only JPG, PNG, WebP, or GIF files up to 5 MB
  are accepted.

Inputs are controlled React fields, and submissions use React form events.
Validation failures and API errors are displayed in the interface.

### 9. React techniques and styling

- Components use `useState` for form, loading, and result state and `useEffect`
  for session and remote-data lifecycle work.
- `AuthContext` shares the authenticated session between navigation, route
  guards, and pages.
- Lifecycle example: `AuthProvider` subscribes to Supabase auth changes when it
  mounts, updates shared user state when the session changes, and unsubscribes
  when it unmounts. The event catalog loads remote data on mount and prevents
  state updates after its page unmounts.
- Components are organized under `src/`; Supabase access is configured in
  `src/lib/supabase.js`.
- Shared responsive styling is in `src/styles.css`.

### 10. Typical user flow

1. Visit MotoMeet and browse the event catalog.
2. Open an event to read its description and see participants.
3. Register or sign in to book the event.
4. Review or change a booking on the event page or in **My bookings**.

### 11. Errors and edge cases

- Registration, sign-in, booking, and data-loading failures are reported in
  the page rather than silently ignored.
- Catalog, details, and account pages display loading, error, and empty states.
- Unknown event or participant IDs show a not-found state.
- Route guards redirect guests to sign-in for private pages and prevent signed
  in users from opening guest-only pages.
- Supabase row-level security protects records even if a user bypasses the UI.

## Deployment

Supabase is the hosted backend. Deploy the frontend as a static Vite app to
Vercel, Netlify, or another static hosting service. Set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the host's build
environment and deploy the repository. `vercel.json` and `public/_redirects`
provide SPA route fallbacks.

**Live frontend URL:** https://moto-meet-flax.vercel.app
