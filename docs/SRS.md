# CampusFix Software Requirements Specification

- **Version:** 1.0
- **Status:** MVP
- **Date:** 2026-10-27

## 1. Introduction

### 1.1 Purpose

This document specifies the requirements for CampusFix, a web application for reporting and managing campus facility issues. It is intended for project stakeholders, developers, testers, and evaluators.

### 1.2 Scope

CampusFix provides a central, trackable workflow for facility reports such as broken lights, plumbing faults, network outages, damaged furniture, and cleanliness concerns. Reporters can submit issues, follow their status, and comment. Administrators can review the campus-wide queue, prioritize reports, advance status, and remove reports.

The MVP provides a browser client, a JSON REST API, and MongoDB persistence. A distinct technician role, technician assignment, and email delivery are not implemented; administrative operations are performed by the `admin` role.

### 1.3 Definitions

- **Reporter:** A registered student or staff member with the `user` role.
- **Administrator:** A user with the `admin` role who can manage all reports.
- **Issue:** A facility report containing a title, description, category, location, priority, status, and reporting user.
- **Comment:** A timestamped message associated with an issue and its author.
- **JWT:** A signed bearer token used to authenticate API requests.

## 2. Overall Description

### 2.1 Product Perspective

CampusFix is a three-tier application:

1. React and Vite browser client.
2. Node.js and Express REST API.
3. MongoDB database accessed through Mongoose.

The client sends JSON requests to the API under `/api`. The API authenticates requests, validates input, enforces role and ownership rules, and reads or writes MongoDB documents.

### 2.2 User Classes

| User class | Capabilities |
| --- | --- |
| Reporter (`user`) | Register, log in, create reports, view their own reports, edit their own open reports, delete their own reports, and comment on their own reports. |
| Administrator (`admin`) | View all reports, filter/search/page through the queue, assign priority, advance report status, delete any report, and comment on reports. |

### 2.3 Operating Environment

- Current desktop or mobile browser with JavaScript enabled.
- Node.js 20 or newer and npm for local development and API execution.
- MongoDB, either local or hosted.
- HTTPS for deployed client and API environments.

### 2.4 Constraints and Assumptions

- Registration creates a `user` account; public registration cannot set an administrator role.
- Administrator accounts are provisioned through the server-side seed process or another trusted administrative process.
- Email addresses are validated and normalized, but institutional-domain verification and email confirmation are not part of the MVP.
- Campus locations are free-text values; the application does not maintain a campus building directory.
- Users need a network connection to use the application.

## 3. Functional Requirements

### 3.1 Authentication and Accounts

- **FR-AUTH-01:** The system shall allow a visitor to register with a name, email address, and password.
- **FR-AUTH-02:** The system shall require names of 2-80 characters, valid email addresses, and passwords of 8-72 characters.
- **FR-AUTH-03:** The system shall reject duplicate email addresses and assign new public registrations the `user` role.
- **FR-AUTH-04:** The system shall hash passwords with bcrypt before persistence and shall never return password hashes in API responses.
- **FR-AUTH-05:** The system shall allow a registered user to log in and receive a signed JWT valid for eight hours.
- **FR-AUTH-06:** The system shall provide an authenticated endpoint that returns the current user's public profile.
- **FR-AUTH-07:** The system shall require a valid bearer token for issue and comment endpoints.

### 3.2 Issue Creation and Reporter Workflow

- **FR-ISS-01:** An authenticated user shall be able to create an issue with title, description, category, location, and priority.
- **FR-ISS-02:** The title shall contain 5-100 characters; the description shall contain 1-1000 characters; the location shall contain 1-160 characters.
- **FR-ISS-03:** Category shall be one of Electrical, Plumbing, Network, Furniture, Cleanliness, or Other.
- **FR-ISS-04:** Priority shall be Low, Medium, or High. New reports shall have status Open.
- **FR-ISS-05:** The system shall record the authenticated user as the issue's reporter and record creation and update timestamps.
- **FR-ISS-06:** A reporter shall see only their own issues in the list and detail views. The list shall show status, priority, category, location, and creation date.
- **FR-ISS-07:** A reporter shall be able to filter their list by status.
- **FR-ISS-08:** A reporter shall be able to edit their own issue only while its status is Open.
- **FR-ISS-09:** A reporter shall be able to delete their own issue. Deleting an issue shall also delete its comments.

### 3.3 Administrator Workflow

- **FR-ADM-01:** An administrator shall be able to view all issues, regardless of reporter.
- **FR-ADM-02:** The administrator queue shall support filtering by status, category, and priority, and case-insensitive title search.
- **FR-ADM-03:** The administrator queue shall support page and limit parameters. The API default limit shall be 10 and the maximum limit shall be 50.
- **FR-ADM-04:** An administrator shall be able to change an issue's priority to Low, Medium, or High.
- **FR-ADM-05:** An administrator shall be able to advance status only along Open to In Progress to Resolved. The system shall reject skipped or backward transitions.
- **FR-ADM-06:** An administrator shall be able to delete any issue. Deleting an issue shall also delete its comments.
- **FR-ADM-07:** The client shall restrict the administrator dashboard to administrators and protect reporter-only views from administrator accounts.

### 3.4 Comments

- **FR-COM-01:** An authorized user shall be able to add a comment of 1-1000 characters to an issue they may access.
- **FR-COM-02:** An authorized user shall be able to retrieve comments for an issue they may access.
- **FR-COM-03:** Each comment shall reference its issue and author and record creation and update timestamps.
- **FR-COM-04:** Comments shall be stored as separate documents rather than embedded in the issue document.

### 3.5 API Error Handling

- **FR-ERR-01:** The API shall return JSON responses for successful requests and errors.
- **FR-ERR-02:** Error responses shall use `{ "success": false, "message": "..." }` and appropriate HTTP status codes, including 400, 401, 403, 404, 409, and 500.
- **FR-ERR-03:** Unexpected server errors shall not reveal stack traces or internal details to clients.

## 4. External Interface Requirements

### 4.1 User Interface

- The browser client shall provide registration, login, issue list, issue report form, issue detail/comment view, and administrator queue screens.
- Forms shall use labelled, controlled inputs and show validation or request errors.
- The client shall provide loading and empty states where applicable and disable submissions while requests are in progress.
- Controls shall be usable by keyboard and the layout shall adapt to mobile and desktop widths.

### 4.2 REST Interface

All paths below are relative to `/api`. Authenticated requests use `Authorization: Bearer <JWT>`.

| Method | Path | Purpose | Authorization |
| --- | --- | --- | --- |
| POST | `/auth/register` | Register a reporter | Public |
| POST | `/auth/login` | Authenticate and issue a token | Public |
| GET | `/auth/me` | Read current user profile | Authenticated |
| POST | `/issues` | Create an issue | Authenticated |
| GET | `/issues` | List issues, filters, search, pagination | Reporter: own; admin: all |
| GET | `/issues/:id` | Read issue details | Reporter: own; admin: all |
| PUT | `/issues/:id` | Update an open issue | Owner only |
| PATCH | `/issues/:id/status` | Advance issue status | Admin only |
| PATCH | `/issues/:id/priority` | Assign issue priority | Admin only |
| DELETE | `/issues/:id` | Delete issue and comments | Owner or admin |
| POST | `/issues/:id/comments` | Add a comment | Reporter: own issue; admin: all |
| GET | `/issues/:id/comments` | List comments | Reporter: own issue; admin: all |
| GET | `/health` | Check API availability | Public |

### 4.3 Configuration Interface

The API shall read `PORT`, `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` from server environment configuration. The client shall read `VITE_API_URL` at build time. Seed credentials shall remain server-side and shall not be included in the client bundle or source control.

## 5. Data Requirements

### 5.1 User

- `name`: required string, 2-80 characters.
- `email`: required, normalized, unique, and indexed.
- `password`: required bcrypt hash; excluded from normal query selection and API output.
- `role`: `user` or `admin`; defaults to `user`.
- Timestamps: `createdAt`, `updatedAt`.

### 5.2 Issue

- `title`: required string, 5-100 characters.
- `description`: required string, 1-1000 characters.
- `category`: required supported category.
- `location`: required string, 1-160 characters.
- `priority`: Low, Medium, or High.
- `status`: Open, In Progress, or Resolved; defaults to Open.
- `reportedBy`: required reference to User.
- Timestamps: `createdAt`, `updatedAt`.
- Indexes shall support reporter, status, category, priority, and creation-time queries.

### 5.3 Comment

- `issue`: required reference to Issue and indexed.
- `author`: required reference to User.
- `text`: required string, 1-1000 characters.
- Timestamps: `createdAt`, `updatedAt`.

## 6. Non-Functional Requirements

### 6.1 Security

- **NFR-SEC-01:** Passwords shall be hashed with bcrypt; plaintext passwords shall not be stored.
- **NFR-SEC-02:** Protected API operations shall verify JWTs and load the current user and role from the database.
- **NFR-SEC-03:** The API shall rate-limit login and registration to 10 requests per client IP per 15-minute window.
- **NFR-SEC-04:** The API shall use Helmet and shall allow browser CORS only from the configured `CLIENT_ORIGIN`.
- **NFR-SEC-05:** The API shall validate request bodies, route identifiers, and query parameters; unexpected fields and NoSQL operator objects shall be rejected.
- **NFR-SEC-06:** Secrets shall be supplied through server environment variables and excluded from source control and frontend bundles.
- **NFR-SEC-07:** Issue ownership shall be enforced by the API for reads, edits, deletes, and comments; client-side route protection shall not replace server authorization.

### 6.2 Reliability and Error Handling

- **NFR-REL-01:** Asynchronous route errors shall be passed to centralized error handling rather than causing unhandled server failures.
- **NFR-REL-02:** Internal exceptions and stack traces shall not be returned in production API responses.

### 6.3 Usability and Accessibility

- **NFR-USE-01:** Inputs shall have associated labels and accessible validation/error feedback.
- **NFR-USE-02:** The interface shall support narrow mobile viewports and desktop viewports without requiring horizontal scrolling for primary workflows.
- **NFR-USE-03:** Status and priority shall be communicated with text in addition to color.

### 6.4 Maintainability and Performance

- **NFR-MNT-01:** Client HTTP requests shall use one shared API client; route handlers shall delegate business logic to controllers.
- **NFR-PERF-01:** Issue listing shall use server-side pagination with a maximum page size of 50.
- **NFR-PERF-02:** Database indexes shall support common issue filters and reporter scoping.
- No quantitative latency or uptime service-level objective is defined for this MVP.

## 7. Acceptance Criteria

The MVP is acceptable when the following can be demonstrated:

1. A visitor registers and logs in; the response does not expose a password hash.
2. An unauthenticated request to a protected issue endpoint is rejected.
3. A reporter creates an issue and sees it in their own list, but another reporter cannot read, edit, delete, or comment on it.
4. A reporter can edit an Open issue, but cannot edit it after it moves to In Progress.
5. An administrator sees all reports and can filter, search, and paginate the queue.
6. An administrator can adjust priority and advance status through the allowed sequence; invalid transitions are rejected.
7. Comments persist as separate documents and can be retrieved by authorized users.
8. Invalid fields, invalid filters, and limits above 50 are rejected with a client error.
9. The client production build and API integration test suite complete successfully.

## 8. Out of Scope

The MVP does not include image upload, email notifications, issue upvotes, analytics dashboards, campus SSO, email verification, password recovery, a separate technician role, technician assignment, or a quantified production availability target.
