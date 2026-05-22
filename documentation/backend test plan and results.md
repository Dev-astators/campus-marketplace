# Test Plan and Results

## Campus Marketplace – UniSquare

**Course:** COMS3009A: Software Design III  
**Group Name:** Dev-astators  
 

---

## 1. Executive Summary

This document outlines the testing strategy, test coverage, and results for the UniSquare Campus Marketplace application. The project follows a **test-driven development (TDD)** approach, where unit and acceptance tests are written alongside implementation for every user story. All tests are executed automatically on every pull request via **GitHub Actions**.

---

## 2. Testing Strategy

### 2.1 Approach

The project adopts a **Given-When-Then** format for acceptance tests, ensuring that each user story is verifiable through clear, repeatable scenarios.

| Test Type | Coverage | Tools |
| :--- | :--- | :--- |
| **Unit Tests** | Individual functions, middleware, service methods | Jest |
| **Integration Tests** | API routes with Supertest | Supertest + Jest |
| **Acceptance Tests** | User story validation (US01–US05) | Jest |
| **Continuous Integration** | Automatic test execution on PR/push | GitHub Actions |

### 2.2 Test Environment

| Component | Configuration |
| :--- | :--- |
| Test Runner | Jest 29.x |
| HTTP Testing | Supertest |
| Mock Database | Supabase client mocked at service layer |
| CI Platform | GitHub Actions |
| Environment Variables | `.env.test` |

---

## 3. User Story Acceptance Tests

### US01: Sign-in with University Email

**Test File:** `us01_signin.test.js`

| Test Case | Given | When | Then |
| :--- | :--- | :--- | :--- |
| Valid Wits email | `bradley.smith@students.wits.ac.za` | Email validation called | Returns `true` |
| Personal Gmail address | `bradley.smith@gmail.com` | Email validation called | Returns `false` |
| Different university | `nkosinathi.khumalo@students.uct.ac.za` | Email validation called | Returns `false` |
| Invalid email format | `invalidEmail` | Email validation called | Returns `false` |
| Empty string | `""` | Email validation called | Returns `false` |
| Null value | `null` | Email validation called | Returns `false` |
| Case insensitivity | `NKOSINATHI@STUDENTS.WITS.AC.ZA` | Email validation called | Returns `true` |

---

### US02/US03: Role-based Dashboard Redirect

**Test File:** `us02_us03_role_redirect.test.js`

| Test Case | Given | When | Then |
| :--- | :--- | :--- | :--- |
| Admin redirect | User role = `admin` | `getRoleRedirect()` called | Returns `/admin-dashboard` |
| Facility staff redirect | User role = `facility_staff`, facility_id = `facility-1` | `getRoleRedirect()` called | Returns `/facility-dashboard/facility-1` |
| Student redirect | User role = `student` | `getRoleRedirect()` called | Returns `/student-dashboard` |
| Unrecognised role | User role = `unknown` | `getRoleRedirect()` called | Returns `null` |
| Empty string role | User role = `""` | `getRoleRedirect()` called | Returns `null` |

---

### US04/US05: Listings Management

**Test File:** `us04_us05_listings.test.js`

#### US-04: Student browses active listings

| Test Case | Given | When | Then |
| :--- | :--- | :--- | :--- |
| Fetch active listings | Signed-in student visits marketplace | `getActiveListings()` called | Returns array of listings |
| Required fields present | Active listings exist | Listings fetched | Each listing has required fields |
| Status filter | Listings fetched | Filter applied | All returned listings have `status = "active"` |

#### US-05: Student posts a listing

**Input Validation:**

| Test Case | Input | Expected |
| :--- | :--- | :--- |
| Valid listing | All fields correct | `valid: true`, no errors |
| Missing title | `title: ""` | Error: "title is required" |
| Invalid category | `category: "Groceries"` | Error: category must be one of allowed values |
| Negative price | `askingPrice: -50` | Error: "asking_price must be a positive number" |
| Zero price | `askingPrice: 0` | Error: "asking_price must be a positive number" |
| Invalid condition | `condition: "broken"` | Error: condition must be one of allowed values |
| Invalid listing type | `listingType: "auction"` | Error: listing_type must be one of allowed values |

**Role Enforcement:**

| Test Case | User Role | Action | Expected |
| :--- | :--- | :--- | :--- |
| Student creates listing | `student` | POST `/api/listings` | 201 Created |
| Facility staff creates listing | `facility_staff` | POST `/api/listings` | 403 Forbidden |

---

## 4. Code Coverage and Test Results Summary



> **Screenshot 1:** Jest coverage report   
> ![Test Results Screenshot](./Server%20tests%20screenshots.png)

---

## 5. Middleware & Validation Tests

### 5.1 Authentication Middleware (`middleware.test.js`)

#### verifySession

| Test Case | Given | When | Then |
| :--- | :--- | :--- | :--- |
| Valid token | Bearer token with valid JWT | `verifySession()` called | `req.user` set, `next()` called |
| No Authorization header | `headers.authorization` undefined | Middleware runs | 401 Unauthorized |
| No Bearer prefix | `"invalid-token-format"` | Middleware runs | 401 Unauthorized |
| Malformed header | `"Bearer "` (empty token) | Middleware runs | 401 Unauthorized |
| Expired token | Supabase returns JWT expired error | Middleware runs | 401 Unauthorized |
| Supabase server error | Supabase rejects request | Middleware runs | 500 Internal Server Error |

#### requireRole

| Test Case | Given | When | Then |
| :--- | :--- | :--- | :--- |
| Authorized staff | User role = `facility_staff` | `requireRole('facility_staff')` | `next()` called |
| Admin access | User role = `admin` | `requireRole('facility_staff', 'admin')` | `next()` called |
| Unauthorized student | User role = `student` | `requireRole('facility_staff')` | 403 Forbidden |
| No user on request | `req.user = null` | Middleware runs | 401 Unauthorized |
| Profile lookup failure | Supabase DB error | Middleware runs | 500 Internal Server Error |

#### attachProfile

| Test Case | Given | When | Then |
| :--- | :--- | :--- | :--- |
| Valid profile | User has complete profile | `attachProfile()` called | `req.profile` set, `next()` called |
| No profile found | User exists but no profile row | Middleware runs | 404 Not Found |
| No user on request | `req.user = null` | Middleware runs | 401 Unauthorized |
| Facility staff profile | User role = `facility_staff` | Middleware runs | `req.profile.role = "facility_staff"` |

### 5.2 Listing Validation Middleware (`validateListing.test.js`)

| Test Case | Given | When | Then |
| :--- | :--- | :--- | :--- |
| Valid listing data | Complete valid listing object | `validateListing()` called | `req.validatedListing` set, `next()` called |
| SellerId from profile | Body contains spoofed `sellerId` | Middleware runs | `sellerId` taken from `req.profile` |
| Missing title | `title: ""` | Middleware runs | 400 Bad Request |
| Invalid category | `category: "Groceries"` | Middleware runs | 400 Bad Request |
| Negative price | `askingPrice: -100` | Middleware runs | 400 Bad Request |
| String price parsing | `askingPrice: "350.50"` | Middleware runs | Price parsed to float |
| No description | Description omitted | Middleware runs | `description = null` |
| Title whitespace trim | `title: "   Engineering Notes   "` | Middleware runs | Title trimmed |

---

## 6. Service Layer Tests

### 6.1 Admin Service (`adminService.test.js`)

| Function | Test Case | Expected |
| :--- | :--- | :--- |
| `getAdminSummary` | Valid DB responses | Returns summary metrics with utilization percentage |
| `getAdminSummary` | DB error on listings | Returns error |
| `getAdminSummary` | Zero capacity slots | Utilization percentage = 0 |
| `getAdminAnalytics` | Valid data | Returns popularCategories and transactionsOverTime |
| `getAdminAnalytics` | DB error | Returns error |
| `getModerationQueue` | Flagged items exist | Returns flaggedListings and flaggedReviews |
| `resolveListingFlag` | Valid listing ID | Updates `is_flagged = false` |
| `resolveReviewFlag` | Valid review ID | Updates `is_flagged = false` |
| `getAllUsers` | Valid profiles | Returns user list |
| `updateUserRole` | Valid role | Returns updated profile |
| `updateUserRole` | Invalid role | Returns error without DB call |
| `getFacilities` | Active facilities | Returns facility list |
| `upsertFacility` | No ID | Creates new facility |
| `upsertFacility` | With ID | Updates existing facility |

### 6.2 Listing Service (`listingService.test.js`)

| Function | Test Case | Expected |
| :--- | :--- | :--- |
| `getPublicSellerProfile` | Seller exists | Returns seller profile + listings |
| `getPublicSellerProfile` | Seller not found | Returns error |
| `createListing` | No images | Creates listing only |
| `createListing` | With images | Creates listing + inserts images |

### 6.3 Facility Dashboard Service (`facilityDashboardService.test.js`)

| Function | Test Case | Expected |
| :--- | :--- | :--- |
| `getFacilityDashboard` | No active facility | Returns empty dashboard payload |
| `getFacilityDashboard` | Complete data | Returns normalized dashboard UI data |
| `getFacilityDashboard` | Staff has no assigned facility | Returns 403 permission error |
| `advanceFacilityTransaction` | `confirm_dropoff` succeeds | Confirms receipt, returns next action |
| `advanceFacilityTransaction` | `confirm_buyer_arrival` before drop-off | Returns 400 step validation error |
| `advanceFacilityTransaction` | `confirm_cash_handoff` succeeds | Marks cash settled |
| `advanceFacilityTransaction` | `release_item` succeeds | Completes transaction |

### 6.4 PayFast Service (`payfastService.test.js`)

| Function | Test Case | Expected |
| :--- | :--- | :--- |
| `buildPaymentPayload` | Live mode | Returns PayFast payload with signature |
| `buildPaymentPayload` | Sandbox mode | Removes `notify_url`, uses sandbox URL |
| `verifyITN` | Valid signature + COMPLETE status | Returns `true` |
| `verifyITN` | Invalid signature | Returns `false` |

### 6.5 SA Data Integration (`sa_data_integration.test.js`)

| Function | Test Case | Expected |
| :--- | :--- | :--- |
| `getCPIByCategory` | Valid category | Returns CPI data with Stats SA source |
| `getCPIByCategory` | Invalid category | Returns error "No CPI data found" |
| `getSuggestedPriceRange` | Valid price + category | Returns `{ low, high }` range |
| `getSuggestedPriceRange` | Invalid category | Returns `null` |

---

## 7. Route Integration Tests

### 7.1 Admin Routes (`admin.route.test.js`)

| Endpoint | Method | Test Case | Expected |
| :--- | :--- | :--- | :--- |
| `/admin/summary` | GET | Success | 200 with summary data |
| `/admin/analytics` | GET | Success | 200 with analytics data |
| `/admin/moderation` | GET | Success | 200 with moderation queue |
| `/admin/moderation/listings/:id/resolve` | PATCH | Success | 200 with `{ success: true }` |
| `/admin/users` | GET | Success | 200 with users array |
| `/admin/users/:userId/role` | PATCH | Missing role field | 400 Bad Request |
| `/admin/facilities` | GET | Success | 200 with facility list |
| `/admin/facilities` | POST | Success | 201 Created |

### 7.2 Listings Routes (`routes.listings.test.js` + `routes.listing.test.js`)

| Endpoint | Method | Test Case | Expected |
| :--- | :--- | :--- | :--- |
| `/api/listings` | GET | Success | 200 with listings array |
| `/api/listings/my/:sellerId` | GET | Unauthorized access | 401 Unauthorized |
| `/api/listings/seller/:sellerId` | GET | Seller not found | 404 Not Found |
| `/api/listings` | POST | Validation fails | 400 Bad Request |
| `/api/listings` | POST | Success | 201 Created |
| `/api/listings/:id` | GET | Listing found | 200 with listing |
| `/api/listings/:id` | DELETE | Success | 200 `{ success: true }` |
| `/api/listings/:id` | PUT | Success | 200 with updated listing |
| `/api/listings/suggested-price` | GET | Valid category + price | 200 with suggestion object |
| `/api/listings/suggested-price` | Missing params | 400 Bad Request |
| `/api/listings/suggested-price` | Invalid category | 404 Not Found |

### 7.3 Messages Routes (`routes.messages.test.js`)

| Endpoint | Method | Test Case | Expected |
| :--- | :--- | :--- | :--- |
| `/` | POST | Missing content | 400 Bad Request |
| `/` | POST | Success | 200 with message object |
| `/:listingId/:userA/:userB` | GET | Success | 200 with messages array |
| `/user/:userId` | GET | Success | 200 with user's messages |

### 7.4 Payments Routes (`routes.payments.test.js`)

| Endpoint | Method | Test Case | Expected |
| :--- | :--- | :--- | :--- |
| `/initiate` | POST | Missing listingId | 400 Bad Request |
| `/initiate` | POST | Listing not found | 404 Not Found |
| `/initiate` | POST | Valid request | 200 with PayFast payload |
| `/slots/:facilityId` | GET | Filters full slots | Returns only available slots |
| `/book-slot` | POST | Success | 200 with bookingId |
| `/status/:transactionId` | GET | Success | 200 with transaction data |

### 7.5 Facility Dashboard Routes (`routes.facilityDashboard.test.js`)

| Endpoint | Method | Test Case | Expected |
| :--- | :--- | :--- | :--- |
| `/` | GET | Success | 200 with dashboard data |
| `/transactions/:transactionId/actions` | POST | Invalid action | 400 Bad Request |
| `/transactions/:transactionId/actions` | POST | Valid action | 200 with updated dashboard |

---

## 8. How to Run Tests Locally

Follow these steps to execute the test suite on your local machine:

```bash
# 1. Clone the repository
git clone https://github.com/Dev-astators/campus-marketplace.git
cd campus-marketplace/server

# 2. Install dependencies
npm install

# 3. Set up test environment variables
cp .env.example .env.test

# 4. Run all tests
npm test

# 5. Run a specific test file
npm test -- us01_signin.test.js

# 6. Run tests with coverage
npm run test:coverage

# 7. Run tests in watch mode (during development)
npm run test:watch
