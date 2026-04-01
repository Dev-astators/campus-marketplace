# Campus Marketplace – Frontend (Client) README

## Overview

The **client** directory contains the React frontend for the Campus Marketplace platform.

This application provides the user interface for:

* browsing listings
* creating listings
* messaging between students
* booking trade facility slots
* making payments
* viewing dashboards
* managing user profiles
* interacting with ratings & trust systems

Built with:

* React (Vite)
* Tailwind CSS

The frontend communicates with the backend Express API located in `/server`.

---

# Folder Structure

Project structure inside `/client`

```
client/
│
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│
├── index.html
├── vite.config.js
└── package.json
```

---

# Folder Responsibilities

## public/

Contains static files such as:

* logos
* favicon
* static images
* manifest files

These are served directly without processing.

Example:

```
public/logo.png
public/favicon.ico
```

---

## src/

Main application logic lives here.

---

## src/assets/

Stores reusable static resources:

Examples:

* images
* icons
* fonts
* illustrations

Example:

```
assets/
  campus-logo.png
  placeholder-image.png
```

Use assets when the file is reused across multiple pages.

---

## src/components/

Reusable UI building blocks live here.

Examples:

```
components/
  Navbar.jsx
  Footer.jsx
  ListingCard.jsx
  Button.jsx
  Modal.jsx
```

Rules:

Components must be:

* reusable
* small
* modular
* UI-focused (not page-level logic)

Avoid putting API calls directly inside generic components.

---

## src/pages/

Each page represents a route-level screen.

Examples:

```
pages/
  Home.jsx
  Login.jsx
  Register.jsx
  Listings.jsx
  ListingDetails.jsx
  Dashboard.jsx
  Profile.jsx
```

Pages may:

* fetch backend data
* manage state
* compose components together

Pages should **not** contain repeated UI code — move reusable parts to `/components`.

---

# Component Design Principles

Follow this structure:

Example:

```
pages/
  Listings.jsx

components/
  ListingCard.jsx
  FilterSidebar.jsx
  SearchBar.jsx
```

Pages orchestrate logic

Components render UI pieces

---

# Naming Conventions

Use:

### Components

```
PascalCase.jsx
```

Example:

```
ListingCard.jsx
TradeSlotSelector.jsx
MessagePanel.jsx
```

---

### Pages

```
PascalCase.jsx
```

Example:

```
Dashboard.jsx
Profile.jsx
Login.jsx
```

---

### Assets

```
kebab-case
```

Example:

```
campus-logo.png
default-avatar.png
```

---

# Styling Guidelines (Tailwind CSS)

Use Tailwind utility classes directly inside JSX:

Example:

```
<div className="flex items-center justify-between p-4 shadow-md rounded-xl">
```

Rules:

Avoid inline styles unless necessary

Prefer:

```
flex
grid
spacing utilities
responsive utilities
```

Example:

```
md:grid-cols-2
lg:grid-cols-4
```

Create reusable styling patterns via components when repeated frequently.

---

# Page Responsibilities in This Project

Expected pages for Campus Marketplace:

Home

Shows:

* featured listings
* search bar
* categories

Listings

Shows:

* filtered listings
* category browsing
* price filters

Listing Details

Shows:

* item images
* description
* seller rating
* trade options

Dashboard

Shows:

* analytics widgets
* recent activity
* booking summary

Messages

Shows:

* chat between buyer and seller

Profile

Shows:

* user info
* ratings
* transaction history

Trade Facility Booking

Shows:

* available slots
* drop-off booking
* collection booking

---

# API Communication Strategy

All backend communication should:

Use:

```
/server/src routes
```

Example:

```
GET /api/listings
POST /api/bookings
POST /api/messages
```

Best practice:

Create a future folder:

```
src/services/
```

Example:

```
listingService.js
authService.js
bookingService.js
```

This keeps API logic separate from UI logic.

---

# Recommended Future Folder Expansion

As the project grows, expand `src/` like this:

```
src/
 ├── assets/
 ├── components/
 ├── pages/
 ├── services/
 ├── hooks/
 ├── context/
 ├── routes/
 └── utils/
```

This prevents architecture issues later in development.

---

# Running the Frontend Locally

Install dependencies:

```
npm install
```

Start development server:

```
npm run dev
```

Default:

```
http://localhost:5173
```

---

# Contribution Workflow

Before starting work:

```
git pull origin main
```

Create feature branch:

```
git checkout -b feature/listing-page-ui
```

Commit format:

```
feat: added listing card component
fix: corrected navbar alignment
style: improved dashboard spacing
```

Push branch:

```
git push origin feature/listing-page-ui
```

Open Pull Request

Request review before merge

---

# Component Contribution Rules

Before creating a new component:

Check if one already exists

Prefer reuse over duplication

Keep components:

small
focused
testable

Example:

Good:

```
ListingCard.jsx
```

Bad:

```
ListingsPageEverything.jsx
```

---

# Tailwind Best Practices for Team Consistency

Prefer:

```
rounded-xl
shadow-md
p-4
gap-4
```

Instead of:

```
custom CSS files
```

Use consistent spacing scale across project.

---

# Team Collaboration Strategy

Suggested division:

Developer 1

Navigation + layout components

Developer 2

Listings pages

Developer 3

Messaging UI

Developer 4

Dashboard analytics UI

Developer 5

Authentication pages

Developer 6

Trade facility booking UI

Everyone contributes shared components when needed.

---

# Future Improvements Planned

Upcoming frontend integrations:

Authentication provider

Payment gateway UI

Rating system interface

Analytics dashboard widgets

ML-powered price suggestions display

Mobile responsiveness improvements

Accessibility enhancements

---

# Important Rule

Never commit:

```
node_modules/
.env
dist/
```

Always check `.gitignore` before pushing.
