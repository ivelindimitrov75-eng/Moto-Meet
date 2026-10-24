# MotoMeet

MotoMeet will help riders find social motorcycle events and join rides with
their bikes. This is the first step: the home page and the registration form.

## Steps made

### Step 1: Make the first page and registration form

- I made the first MotoMeet page with a simple dark and orange style.
- I added motorcycle photos. You can choose a photo to change the large image.
- I added a form for a name, email, password, and password check.
- The form checks the details and creates an account with Supabase.
- The page shows a message when the account is made or when something goes
  wrong.
- The page loads community updates from the Supabase `todos` table.

## Functional guide

### 1. About the project

MotoMeet is for riders who want to meet other riders and join motorcycle
events. This first step only has the start page and a registration form.

### 2. Who can use the site?

- Guests can see the start page, choose a motorcycle photo, and create an
  account.
- Event lists, bookings, and private pages are not made yet. The community
  updates section reads rows from the `todos` table.

### 3. Sign in and accounts

- A new rider enters their name, email, and password.
- The page checks the form and sends the details to Supabase.
- Supabase creates the account. The page shows what to do next.
- Login and logout will be added in a later step.

### 4. Pages and links

- `/` shows the MotoMeet start page and registration form.
- Other pages and route rules will be added later.

### 5. Events

Event lists and event details are not made yet.

### 6. Data

Supabase Auth stores new accounts. The home page also reads `id` and `name`
fields from the Supabase `todos` table to display community updates. Copy
`.env.example` to `.env` and set the Supabase project URL and publishable key
before running the app.

### 7. Add, view, change, and delete

Event and motorcycle actions are not made yet. Community updates are read-only;
the page shows loading, empty, and error states when fetching them.

### 8. Forms

The registration form checks these fields:

- Name is required and must have at least two letters.
- Email is required and must look like an email address.
- Password is required and must have at least six characters.
- The second password must match the first one.

The page shows a clear message if a check fails or Supabase cannot make the
account.

### 9. React and page style

- React state keeps the form values and messages.
- React state also changes the large photo when a rider chooses a thumbnail.
- CSS styles the page and adjusts it for smaller screens.
- Shared sign-in state will be added when login is built.

### 10. A rider's first visit

1. Open the MotoMeet start page.
2. Choose a motorcycle photo.
3. Enter name, email, and password.
4. Create an account and follow the message on the page.

### 11. Errors and empty pages

The form shows missing details, passwords that do not match, and account
creation errors. Community updates show loading, empty, and query error states.


### Step 2: Add the login page

- Riders can open `/login` from the home page or the account form.
- The login page uses the Supabase client to sign in with an email address
  and password.
- The page shows a clear message when sign-in succeeds or when something
  goes wrong.
- Riders can return to the registration form to create an account.
- The login page uses the supplied motorcycle photo and adjusts for smaller
  screens.

### Step 3: Book motorcycle events

- Riders can open `/events` from the home page and sign in to book one of three
  events: a cafe meetup, a concert, or a scenic tour.
- After registration, riders are sent to the login page; after signing in,
  they are sent to the events page.
- Each rider can save and edit their name, email, motorcycle make, model, and
  optional year for each event, or delete their own booking.
### Step 4: Editing routes and participant options
- Event participants' names, motorcycle details, and motorcycle photos are
  visible to all visitors. Only the account owner can edit or delete their
  booking or change their photo.
- Riders can optionally upload a motorcycle photo, limited to 5 MB.
- Supabase Auth is required to book or manage participation. Row-level security
  protects booking changes and personal email addresses.


## Later steps

- Simple admin options will be added to help manage events and bookings.
