# Campus Marketplace – Backend (Server) README

## Overview

The **server** directory contains the Express.js backend API for the Campus Marketplace platform.

This backend handles:

* authentication integration
* listings management
* trade facility booking logic
* messaging system support
* payment tracking
* ratings and trust system
* analytics aggregation

The backend exposes RESTful APIs consumed by the React frontend.

---

# Current Structure

```
server/
 └── src/
      index.js
```

This will expand as features are implemented.

---

# Recommended Backend Architecture

As development progresses, the server should follow this structure:

```
server/
 └── src/
      ├── config/
      ├── controllers/
      ├── middleware/
      ├── models/
      ├── routes/
      ├── services/
      ├── utils/
      └── index.js
```

Each folder has a clear responsibility.

---

# Folder Responsibilities

## config/

Stores configuration files such as:

* database connection setup
* authentication provider setup
* environment variable management
* payment gateway configuration

Example:

```
config/
  db.js
  auth.js
  payment.js
```

---

# routes/

Defines API endpoints grouped by feature.

Example:

```
routes/
  authRoutes.js
  listingRoutes.js
  bookingRoutes.js
  messageRoutes.js
  ratingRoutes.js
```

Routes should only define endpoints — not business logic.

Example:

```
router.post("/create-listing", createListing)
```

---

# controllers/

Controllers handle request logic between routes and services.

Example:

```
controllers/
  listingController.js
```

Example responsibility:

```
receive request
validate input
call service
return response
```

---

# services/

Services contain business logic.

Example:

```
services/
  listingService.js
```

Example responsibility:

```
database queries
price suggestion logic
transaction processing
booking validation
```

Controllers should call services — not the database directly.

---

# models/

Defines database schemas.

Example (future):

```
models/
  User.js
  Listing.js
  Booking.js
  Message.js
  Rating.js
```

Used with:

MongoDB / PostgreSQL / Prisma / Sequelize (team decision later)

---

# middleware/

Reusable Express middleware lives here.

Examples:

```
middleware/
  authMiddleware.js
  errorHandler.js
  roleCheck.js
```

Used for:

authentication checks
admin permissions
student permissions
request validation
error handling

---

# utils/

Reusable helper functions.

Examples:

```
utils/
  logger.js
  validators.js
  dateHelpers.js
```

Keeps controllers clean.

---

# index.js

Entry point of backend server.

Responsible for:

* creating Express app
* loading middleware
* connecting database
* registering routes
* starting server

Example structure:

```
load environment variables
configure middleware
register routes
start server
```

---

# API Route Design Standards

Follow REST conventions.

Examples:

Listings

```
GET    /api/listings
GET    /api/listings/:id
POST   /api/listings
PUT    /api/listings/:id
DELETE /api/listings/:id
```

Bookings

```
POST /api/bookings
GET  /api/bookings/:id
```

Messages

```
GET  /api/messages/:conversationId
POST /api/messages
```

Ratings

```
POST /api/ratings
GET  /api/users/:id/ratings
```

---

# Role-Based Access Control

System roles:

Student
Trade Facility Staff
Admin

Middleware example:

```
roleCheck(["Admin"])
```

Used to protect routes such as:

```
/api/admin/configure-slots
```

---

# Payment Integration Strategy

Payment routes:

```
POST /api/payments/create-session
POST /api/payments/confirm
```

Tracks:

full payment
partial payment
cash shortfall

Trade facility staff confirm final settlement before item release.

---

# Trade Facility Booking Workflow

Example lifecycle:

```
Student books slot
Staff confirms drop-off
System updates transaction status
Buyer completes payment
Staff confirms collection
Transaction completed
```

Each stage updates database status fields.

---

# Analytics API Endpoints

Required dashboards:

Popular categories over time

```
GET /api/analytics/categories
```

Facility utilisation

```
GET /api/analytics/facility-usage
```

Moderation activity summary

```
GET /api/analytics/moderation
```

Reports exportable as:

CSV
PDF

---

# Environment Variables

Store secrets inside:

```
.env
```

Example:

```
PORT=5000
DB_URI=
AUTH_PROVIDER_KEY=
PAYMENT_GATEWAY_KEY=
```

Never commit `.env` files.

---

# Running the Backend Locally

Install dependencies:

```
npm install
```

Start development server:

```
npm run dev
```

Example default:

```
http://localhost:5000
```

---

# Contribution Workflow

Before working:

```
git pull origin main
```

Create feature branch:

```
feature/listing-api
```

Commit example:

```
feat: implemented listing creation endpoint
fix: corrected booking validation logic
```

Push branch:

```
git push origin feature/listing-api
```

Open Pull Request for review before merge.

---

# Backend Development Principles

Controllers stay lightweight

Business logic lives inside services

Routes stay readable

Middleware handles permissions

Database access centralized in models/services

This keeps the system scalable and testable.
