# CampusFix

CampusFix is a campus facilities issue-reporting system. Students and staff can report and track their own facility issues; admins can triage the campus-wide queue.

## Features

- Account registration and login with bcrypt password hashing and JWT authentication.
- Issue creation with category, campus location, description, and priority.
- Reporter issue list, open-issue editing, issue detail, and comments.
- Admin issue queue with title search, status/category/priority filters, pagination, status progression, priority assignment, and deletion.
- Server-side validation, ownership checks, request throttling on login and registration, Helmet headers, and restricted CORS.

Images, email notifications, upvotes, and analytics are not included in this MVP.

## Stack

- Client: React 18, React Router, Vite, and Lucide icons.
- API: Node.js, Express, Mongoose, express-validator, bcryptjs, and JWT.
- Data: MongoDB. User, Issue, and Comment are separate timestamped documents; comments reference their issue and author.
- Tests: Jest, Supertest, and mongodb-memory-server.

## Requirements

- Node.js 20 or newer and npm.
- A MongoDB instance, local or hosted. The test suite starts an isolated in-memory MongoDB.

## Local Setup

1. Install dependencies from the repository root:

	```sh
	npm install
	```

2. Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI`, generate a private `JWT_SECRET` (for example, `openssl rand -base64 32`), and set the matching `CLIENT_ORIGIN`. Keep `.env` files local and out of version control.

3. Copy `client/.env.example` to `client/.env`. For the default local ports it is already set to `http://localhost:5000/api`.

4. Start both applications:

	```sh
	npm run dev
	```

	The Vite client is at `http://localhost:5173`; the API health check is at `http://localhost:5000/api/health`.

5. To create an admin and repeatable fake facility reports, set `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, and a private `SEED_ADMIN_PASSWORD` of at least 12 characters in `server/.env`, then run:

	```sh
	npm run seed
	```

	The seed script creates or updates the configured admin and adds demo issues only when their titles are not already present for that account. It does not print or include credentials in the repository.

## Environment Variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `PORT` | API | Listen port; defaults to `5000`. |
| `MONGODB_URI` | API, seed | MongoDB connection string. |
| `JWT_SECRET` | API | Private signing secret; use a long random value. |
| `CLIENT_ORIGIN` | API | Exact allowed browser origin, such as `http://localhost:5173`. |
| `SEED_ADMIN_NAME` | Seed | Admin display name. |
| `SEED_ADMIN_EMAIL` | Seed | Admin account email. |
| `SEED_ADMIN_PASSWORD` | Seed | Initial admin password, minimum 12 characters. |
| `VITE_API_URL` | Client | API base URL including `/api`. |

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start client and API in development mode. |
| `npm run build` | Create the client production bundle in `client/dist`. |
| `npm test` | Run API integration tests. |
| `npm run seed` | Create the configured admin and demo issues. |

## API

All endpoints are under `/api`. Except for registration, login, and health, requests require `Authorization: Bearer <token>`.

| Method | Path | Access and behavior |
| --- | --- | --- |
| `POST` | `/auth/register` | Public; creates a reporter account and returns a JWT. |
| `POST` | `/auth/login` | Public; verifies credentials and returns a JWT. |
| `GET` | `/auth/me` | Authenticated; returns the current public user. |
| `POST` | `/issues` | Authenticated; creates an issue (`201`). |
| `GET` | `/issues` | Admin: all issues; reporter: own issues. Supports `page`, `limit` (maximum 50), `status`, `category`, `priority`, and title `search`. |
| `GET` | `/issues/:id` | Admin or owning reporter; returns an issue. |
| `PUT` | `/issues/:id` | Owner only; edits an issue while it is `Open`. |
| `PATCH` | `/issues/:id/status` | Admin only; advances `Open` → `In Progress` → `Resolved`. |
| `PATCH` | `/issues/:id/priority` | Admin only; assigns `Low`, `Medium`, or `High`. |
| `DELETE` | `/issues/:id` | Owner or admin; deletes the issue and its comments. |
| `POST` | `/issues/:id/comments` | Admin or owning reporter; adds a comment. |
| `GET` | `/issues/:id/comments` | Admin or owning reporter; lists comments. |

Errors use `{ "success": false, "message": "..." }`. The API returns standard `400`, `401`, `403`, `404`, `409`, and `500` status codes as applicable; server errors do not include stack traces.

## Deployment

### Frontend

- Build with `npm run build --workspace client`; publish `client/dist`.
- On Vercel, set the project root to `client`, build command to `npm run build`, output directory to `dist`, and configure `VITE_API_URL` to the deployed API origin ending in `/api`. `client/vercel.json` rewrites client routes to `index.html`.
- On Netlify, use base directory `client`, build command `npm run build`, publish directory `dist`, and configure the same `VITE_API_URL`. `client/public/_redirects` supplies the SPA fallback.
- Vercel currently lists the Hobby plan at $0; confirm its personal-use eligibility and current usage allowances. Netlify currently lists a $0 Free plan with a monthly credit budget (300 credits on the pricing page checked for this release). Check both providers' current pricing and limits before choosing a production plan.

### API and database

- Deploy the `server` workspace to Render, Railway, or another Node host. Set `PORT`, `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` in the host's secret/environment settings. `CLIENT_ORIGIN` must exactly match the deployed frontend origin.
- Render currently offers free instances for eligible services, but its documentation explicitly says free instances have limitations and are not for production. Railway's current offer includes a one-time $5 trial credit for 30 days; ongoing Hobby use is paid with monthly included usage. Check current usage, sleep, and availability limits before selecting either host.
- MongoDB Atlas currently lists the shared M0 cluster as free with 512 MB storage. Use a least-privilege database user, restrict network access, and remember that free-tier backups and resources are limited; choose a paid tier if production requirements need them.
- Use HTTPS for the frontend, API, and database connection. Never place the MongoDB URI, JWT secret, or admin password in frontend variables or source control. Configure the admin seed variables as server-only secrets, run `npm run seed` once, then remove `SEED_ADMIN_PASSWORD` from the runtime environment.

Provider plan details checked against their official pricing or documentation pages on 2026-10-27; they can change:

- [Vercel pricing](https://vercel.com/pricing)
- [Netlify pricing](https://www.netlify.com/pricing/)
- [Render pricing](https://render.com/pricing) and [free instance limits](https://render.com/docs/free)
- [Railway pricing](https://railway.com/pricing)
- [MongoDB Atlas pricing](https://www.mongodb.com/pricing) and [free-tier limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)

## Screenshots

Screenshots can be added here after deployment.

## Known Limitations

- No image attachments, email notifications, upvotes, analytics, or automated assignment.
- JWTs expire after eight hours; the client stores the token in local storage.
- The demo seed attaches sample issues to the seeded admin account so no fake reporter password is needed.
- Free hosting and database tiers have resource, availability, and backup limitations and should be evaluated against the deployment's requirements.

## Future Improvements

- Add image upload with file validation and object storage.
- Add email notifications for assignment and status changes.
- Add issue upvotes and operational analytics.