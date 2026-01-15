## Reservations Web App (Next.js + Auth0)

Frontend for booking time slots with Auth0 authentication and Google Calendar conflict checks.

### Features
- Auth0 login/logout.
- Google Calendar connect (separate consent flow).
- Create, edit, and cancel bookings.
- Conflict feedback when a calendar event or booking overlaps.

### Requirements
- Node.js + pnpm
- Backend API running (default `http://localhost:3000`)

### Environment
Create `.env.local` based on `.env.local.example`:

```
AUTH0_SECRET="replace-with-a-long-random-string"
AUTH0_DOMAIN="your-tenant.us.auth0.com"
AUTH0_CLIENT_ID="YOUR_AUTH0_CLIENT_ID"
AUTH0_CLIENT_SECRET="YOUR_AUTH0_CLIENT_SECRET"
AUTH0_AUDIENCE="YOUR_AUTH0_AUDIENCE"
APP_BASE_URL="http://localhost:3010"
BACKEND_URL="http://localhost:3000"
```

Generate `AUTH0_SECRET` with:

```
openssl rand -hex 32
```

### Auth0 Configuration
In Auth0 Application settings add:
- Allowed Callback URLs: `http://localhost:3010/api/auth/callback`
- Allowed Logout URLs: `http://localhost:3010`
- Allowed Web Origins: `http://localhost:3010`

### Run locally
Install deps:

```
pnpm install
```

Start the dev server on a different port than the backend:

```
pnpm dev -- --port 3010
```

Open `http://localhost:3010`.

### Docker
From the backend repo root (`ds-ta`), run:

```
docker compose up --build
```

### Google Calendar connect
After logging in with Auth0, use **Connect Google** to grant calendar access.
Booking creation is enabled only after Google Calendar is connected.
