# Campus Marketplace

## Overview

Campus Marketplace is a secure peer-to-peer trading platform designed specifically for university students to buy, sell, and exchange items within their campus community.

The system improves trust, safety, and convenience through:

* verified student identity authentication
* secure trade facility drop-off and collection workflow
* integrated messaging between users
* partial + full online payments
* rating and trust system
* analytics dashboards
* South African price suggestion integration

This project is developed using **Agile methodology**, **CI/CD principles**, and **test-driven development practices**.

---

# Project Structure

```
CAMPUS-MARKETPLACE/
│
├── client/        React frontend
├── server/        Express backend API
├── tests/         integration + system tests
└── README.md
```

---

# Tech Stack

Frontend

* React (Vite)
* Tailwind CSS

Backend

* Node.js
* Express.js

Future Integrations

* 3rd-party authentication provider
* payment gateway
* analytics reporting engine
* South African pricing datasets

---

# User Roles

The system supports three roles:

### Student

Can:

* create listings
* browse listings
* trade items
* message users
* book facility slots
* make payments
* rate transactions

---

### Trade Facility Staff

Can:

* confirm item drop-off
* confirm item collection
* verify outstanding payments
* update transaction status

---

### Admin

Can:

* configure facility operating hours
* configure slot capacity
* moderate ratings
* manage flagged content
* access analytics dashboards

---

# Core Features

### Item Listings

Students can:

* upload images
* add descriptions
* choose category
* choose condition
* set price
* choose sale or trade

---

### Trade Facility Booking

Supports:

* drop-off scheduling
* collection scheduling
* slot capacity tracking
* transaction lifecycle updates

---

### Messaging System

Allows:

* negotiation between buyers and sellers
* transaction coordination
* secure in-app communication

---

### Payment Integration

Supports:

* full online payment
* partial payment tracking
* recorded cash shortfall
* settlement verification by staff

---

### Rating & Trust System

After transaction completion:

Users can:

* leave ratings
* leave reviews

Admins can:

* remove abusive content
* moderate flagged users

---

### Analytics Dashboards

Includes:

Most popular categories

Completed transactions over time

Trade facility utilisation

Moderated content summary

Reports exportable as:

* CSV
* PDF

---

# Development Workflow

Follow Agile sprint structure.

Each feature must:

1. start as backlog task
2. be implemented in feature branch
3. include tests
4. pass lint checks
5. pass build pipeline
6. be reviewed before merge

Branch naming:

```
feature/listing-page
feature/payment-integration
bugfix/login-error
```

---

# Local Setup

Clone project

```
git clone https://github.com/Dev-astators/campus-marketplace.git
```

Install dependencies

Frontend

```
cd client
npm install
npm run dev
```

Backend

```
cd server
npm install
npm run dev
```

---

# Contribution Guidelines

Before starting work

```
git pull origin main
```

Create branch

```
git checkout -b feature/your-feature-name
```

Commit example

```
feat: implemented listing card component
fix: corrected booking validation
```

Push branch

```
git push origin feature/your-feature-name
```

Open Pull Request before merging.

---

# CI/CD Expectations

Each merge must:

* pass ESLint
* pass tests
* build successfully

Deployment pipeline configured later.

---

# Future Enhancements

Planned upgrades:

* ML price suggestion model
* recommendation engine
* fraud detection indicators
* push notifications
* mobile optimisation
