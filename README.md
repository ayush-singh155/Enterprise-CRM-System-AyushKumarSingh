# Enterprise CRM

An enterprise-style customer relationship management app for managing leads,
customers, deals, sales activities, and team performance. It includes a
role-aware React interface and a REST API backed by MongoDB.

> **Demo credentials are for local development only.** Replace the sample
> passwords and JWT secrets before using this project outside a local demo.

## Features

- **Authentication:** Register a sales-rep account, log in, rotate refresh
  tokens using an HTTP-only cookie, and log out.
- **Role-based access:** Admins manage the whole workspace; managers see their
  own and direct reports' records; sales reps see their own records. The API
  enforces access control, with matching protected navigation and routes in the
  client.
- **Lead management:** Search, filter, sort, paginate, assign, and manage
  prospects. View a lead's activity timeline and convert it into a customer.
- **Customers:** Search and paginate customer records; create, update, and
  delete records with role-scoped ownership.
- **Sales pipeline:** Create and manage deals across New, Contacted, Qualified,
  Proposal, Negotiation, Won, and Lost stages. Drag deals between stages and
  retain stage-change history.
- **Activities and tasks:** Log calls, meetings, notes, and emails; view linked
  timelines and create follow-up tasks with due dates.
- **Email logging:** Send email through optional SMTP settings and save the
  attempt and delivery status as an activity.
- **Dashboard:** Filter date-scoped KPIs and charts for monthly won revenue,
  leads by source, deals by stage, and top sales reps.
- **Admin user management:** Create manager and sales-rep accounts, set
  reporting lines, and search/filter workspace users.
- **API protections:** Joi request validation, centralized error handling,
  Helmet security headers, CORS, and configurable rate limiting.
- **Demo data:** Seed one account per role and sample leads, customers, deals,
  and activities without deleting existing data.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 18, Vite, React Router, Axios, Tailwind CSS, Recharts, `@hello-pangea/dnd` |
| Backend | Node.js 20+, Express 4 |
| Database | MongoDB 6+, Mongoose 8 |
| Authentication | JWT access tokens, rotating HTTP-only refresh cookie, bcrypt |
| Validation and security | Joi, Helmet, CORS, express-rate-limit |
| Email | Nodemailer (optional SMTP configuration) |

## Requirements

- Node.js 20 or later and npm
- MongoDB 6 or later (local instance or hosted connection string)

## Setup

1. Clone or download the project and start MongoDB.
2. Configure the API environment:

   ```sh
   cd server
   copy .env.example .env
   ```

   In `server/.env`, set `MONGODB_URI`, generate distinct random values for
   `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (at least 32 characters each),
   and set the demo account passwords. The sample values work for local
   development but must not be used in a real deployment.
3. Install API dependencies and seed demo accounts and sample CRM records:

   ```sh
   npm install
   npm run seed
   ```

   Seeding is disabled when `NODE_ENV=production`. It is repeatable and does
   not delete or overwrite existing CRM records.
4. Start the API in the `server` directory:

   ```sh
   npm run dev
   ```

   The API listens on `http://localhost:5000` by default. Check
   `http://localhost:5000/api/health` for a health response.
5. In another terminal, install and start the frontend:

   ```sh
   cd client
   npm install
   npm run dev
   ```

   Open the Vite URL shown in the terminal (typically
   `http://localhost:5173`) and sign in with one of the demo accounts below.

The client uses `http://localhost:5000/api` by default. To use another API
origin, create `client/.env.local` and set `VITE_API_URL`, for example:

```env
VITE_API_URL=http://localhost:5000/api
```

Set `CLIENT_ORIGIN` in `server/.env` to the frontend origin if it differs from
the default `http://localhost:5173`.

## Environment variables

Copy `server/.env.example` to `server/.env`. Values marked **required** must
be set; the remaining settings have defaults or are optional.

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test`, or `production`; defaults to `development`. The seed script refuses to run in production. |
| `PORT` | No | API port; defaults to `5000`. |
| `MONGODB_URI` | Yes | MongoDB connection URI. The example uses `mongodb://127.0.0.1:27017/enterprise-crm`. |
| `JWT_ACCESS_SECRET` | Yes | Secret used to sign access tokens; use a random value of at least 32 characters. |
| `JWT_REFRESH_SECRET` | Yes | Separate secret used to sign refresh tokens; use a random value of at least 32 characters. |
| `ACCESS_TOKEN_TTL` | No | Access-token lifetime such as `15m`; defaults to `15m`. |
| `REFRESH_TOKEN_TTL` | No | Refresh-token lifetime such as `7d`; defaults to `7d`. |
| `CLIENT_ORIGIN` | No | Allowed browser origin for credentialed CORS; defaults to `http://localhost:5173`. |
| `RATE_LIMIT_WINDOW_MS` | No | API rate-limit window in milliseconds; defaults to `900000` (15 minutes). |
| `RATE_LIMIT_MAX` | No | Maximum API requests per IP per window; defaults to `100`. Login and registration have additional limits. |
| `ADMIN_NAME` | No | Seed administrator display name; defaults to `CRM Administrator`. |
| `ADMIN_EMAIL` | For seeding | Email for the seeded administrator. |
| `ADMIN_PASSWORD` | For seeding | Seed administrator password; at least 12 characters. |
| `SEED_MANAGER_NAME` | No | Seed manager display name; defaults to `Morgan Manager`. |
| `SEED_MANAGER_EMAIL` | For seeding | Email for the seeded manager. |
| `SEED_MANAGER_PASSWORD` | For seeding | Seed manager password; at least 12 characters. |
| `SEED_REP_NAME` | No | Seed sales-rep display name; defaults to `Riley Sales`. |
| `SEED_REP_EMAIL` | For seeding | Email for the seeded sales rep. |
| `SEED_REP_PASSWORD` | For seeding | Seed sales-rep password; at least 12 characters. |
| `SMTP_HOST` | No | SMTP server hostname. Required together with `SMTP_FROM` to send email. |
| `SMTP_PORT` | No | SMTP port; defaults to `587`. |
| `SMTP_SECURE` | No | Enable secure SMTP transport when `true`; defaults to `false`. |
| `SMTP_USER` | No | SMTP username. Must be set together with `SMTP_PASS`. |
| `SMTP_PASS` | No | SMTP password. Must be set together with `SMTP_USER`. |
| `SMTP_FROM` | For email | Sender email address; required with `SMTP_HOST` to send email. |
| `VITE_API_URL` | No | Frontend API base URL; configure in `client/.env.local`, defaults to `http://localhost:5000/api`. |

## Demo login credentials

After running `npm run seed`, sign in using the values configured in
`server/.env`:

| Role | Default email | Password variable |
| --- | --- | --- |
| Admin | `admin@example.com` | `ADMIN_PASSWORD` |
| Manager | `manager@example.com` | `SEED_MANAGER_PASSWORD` |
| Sales rep | `rep@example.com` | `SEED_REP_PASSWORD` |

For a quick local demo only, the `.env.example` sets all three password
variables to `change-this-to-a-strong-password`. If you change a password in
`.env` after the seed user already exists, the repeatable seed does **not**
reset that user's password. Use a fresh development database or update the
existing user's password directly through a trusted administrative process.

The seed creates an admin, manager, and sales rep, plus sample leads,
customers, deals, and activities. Existing records are preserved.

## API endpoints

All API routes use the `/api` prefix. Protected endpoints require a valid
access token; refresh-token operations use the HTTP-only refresh cookie.
Collection endpoints support pagination where applicable. Request bodies,
query parameters, and IDs are validated.

### Health and authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API health check |
| `POST` | `/api/auth/register` | Public | Register a sales-rep account |
| `POST` | `/api/auth/login` | Public | Authenticate and issue tokens |
| `POST` | `/api/auth/refresh` | Refresh cookie | Rotate refresh token and issue an access token |
| `POST` | `/api/auth/logout` | Public / refresh cookie | Revoke refresh session and clear cookie |
| `GET` | `/api/auth/me` | Authenticated | Get the current user |

### Leads and customers

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/leads` | List scoped leads |
| `POST` | `/api/leads` | Create a lead |
| `GET` | `/api/leads/:id` | Get a lead |
| `PATCH` | `/api/leads/:id` | Update a lead |
| `DELETE` | `/api/leads/:id` | Delete a lead |
| `POST` | `/api/leads/:id/convert` | Convert a lead to a customer; safe to retry |
| `GET` | `/api/customers` | List scoped customers |
| `POST` | `/api/customers` | Create a customer |
| `GET` | `/api/customers/:id` | Get a customer |
| `PATCH` | `/api/customers/:id` | Update a customer |
| `DELETE` | `/api/customers/:id` | Delete a customer |

Lead and customer lists accept `page`, `limit` (up to 100), `search`,
`assignedTo`, `sortBy`, and `sortOrder`. Leads also accept `status`, `source`,
and `company`; customers accept `company`. List responses include `items`,
`total`, `page`, `limit`, and `pages`.

### Deals and dashboard

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/deals` | List scoped deals |
| `POST` | `/api/deals` | Create a deal |
| `GET` | `/api/deals/:id` | Get a deal |
| `PATCH` | `/api/deals/:id` | Update deal details |
| `PATCH` | `/api/deals/:id/stage` | Change stage/probability and record stage history |
| `DELETE` | `/api/deals/:id` | Delete a deal |
| `GET` | `/api/dashboard/summary` | Combined dashboard metrics and chart data |
| `GET` | `/api/dashboard/kpis` | Leads, conversion rate, revenue, open pipeline, customers |
| `GET` | `/api/dashboard/monthly-revenue` | Won revenue grouped by month |
| `GET` | `/api/dashboard/leads-by-source` | Leads grouped by source |
| `GET` | `/api/dashboard/deals-by-stage` | Deals grouped by current stage |
| `GET` | `/api/dashboard/top-reps` | Sales-rep performance; accepts `limit` from 1 to 20 |

Dashboard endpoints accept optional ISO `startDate` and `endDate` query
parameters. Date-only end dates include the full UTC day. Deal stages are
`new`, `contacted`, `qualified`, `proposal`, `negotiation`, `won`, and `lost`.

### Users, activities, and tasks

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/users` | Admin | List active workspace users |
| `POST` | `/api/users` | Admin | Create a manager or sales rep |
| `GET` | `/api/users/assignees` | Authenticated | List assignable users in the caller's scope |
| `GET` | `/api/activities/timeline?lead=:id` | Authenticated | Read a linked activity timeline; use `customer` or `deal` instead of `lead` |
| `POST` | `/api/activities` | Authenticated | Log a call, meeting, note, or email activity |
| `POST` | `/api/activities/email` | Authenticated | Send an email and record its delivery status |
| `GET` | `/api/tasks` | Authenticated | List scoped tasks |
| `POST` | `/api/tasks` | Authenticated | Create a follow-up task |
| `GET` | `/api/tasks/:id` | Authenticated | Get a task |
| `PATCH` | `/api/tasks/:id` | Authenticated | Update a task |
| `DELETE` | `/api/tasks/:id` | Authenticated | Delete a task |

Activities and tasks link to exactly one lead, customer, or deal. Tasks require
a due date and support `open`, `completed`, and `cancelled` statuses.

## Project structure

```text
client/                 React/Vite frontend
  src/components/       Shared layout and route components
  src/context/          Authentication and toast contexts
  src/pages/            Dashboard, leads, customers, users, and pipeline
  src/services/         Axios API client
server/                 Express/Mongoose backend
  src/config/           Environment and database configuration
  src/controllers/      HTTP handlers
  src/middleware/       Authentication, validation, and error handling
  src/models/           Mongoose models
  src/routes/           REST API routes
  src/services/         Business logic and aggregations
  src/validation/       Joi schemas
  seed.js               Development demo data seeder
```
