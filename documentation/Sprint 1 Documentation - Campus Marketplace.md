# **Sprint 1 Documentation \- Campus Marketplace**

---

1. ## **Sprint Overview**

   ## **Sprint Number:** Sprint 1    **Duration:** 30 March – 13 April 2026

   ## **Sprint Goal:**    To implement the foundational features of the Campus Marketplace, including user authentication and basic marketplace functionality such as viewing and creating listings.

     
2. **Sprint Backlog**

| ID | User Story | Story Points | Status |
| :---- | :---- | :---- | :---- |
| US1 | As a **student**, I must be able to sign in with my Wits email/Google account so that I can securely access the marketplace. | 3 pts | Complete |
| US2 | As an **admin**, I want to sign in and access system dashboards so that I can monitor platform activity. | 3 pts | In Progress |
|  US3 | As a **trade facility staff member**, I must be able to sign in and access the trade facility dashboard so that I can manage item drop-off and collection. | 3 pts | In Progress |
| US4 | As a **student**, once I’ve logged in, I must be able to see available products so that I can find items to buy or trade. |  3 pts | In Progress |
| US5 | As a **student**, I must be able to create listings so that other students can view and purchase or trade my items. | 5 pts | Not Started |

## **3\. Task Breakdown**

### **US1: Student Sign In**

* Design login page UI  
* Implement Supabase authentication  
* Handle session management  
* Redirect to main page

### **US3: Trade Facility Staff Access**

* Create trade facility login  
* Implement role-based access  
* Design dashboard structure  
* Prepare booking management UI

### **US4: View Listings**

* Fetch listings from backend  
* Build listings UI  
* Display items with details  
* Handle empty states

### **US5: Create Listings**

* Design listing form  
* Add image upload support  
* Validate user input  
* Store listing data

## **4\. User Acceptance Tests (UATs)**

### **US1: Student Login**

* Given a student has valid credentials  
* When they log in  
* Then they should be granted access to the system

### **US4: View Listings**

* Given a student is logged in  
* When they access the marketplace  
* Then available listings should be displayed

### **US5: Create Listing**

* Given a logged-in student  
* When they submit a valid listing  
* Then the listing should be saved and visible to other users

## **5\. Implementation Details**

The system was developed using:

* **Frontend:** React (Vite)  
* **Routing:** React Router  
* **Backend Service:** Supabase (authentication and data handling)  
* **Version Control:** GitHub

Authentication was implemented using Supabase, requiring environment variables to securely connect the frontend to backend services.

## **6\. Scrum Process**

### **Sprint Planning**

* User stories were selected based on priority and feasibility  
* Tasks were created and assigned using Trello

### **Daily Scrums**

* Team members discussed:  
  * progress  
  * current tasks  
  * blockers

### **Backlog Refinement**

* User stories were reviewed and updated for clarity  
* Future sprint items were prioritised

### **Sprint Retrospective**

* The team reflected on challenges and improvements  
* Key learning areas were identified for the next sprint

## **7\. Progress and Results**

During Sprint 1:

* Authentication UI and routing were successfully implemented  
* Supabase integration was configured  
* Core UI structure (pages and components) was developed

Some functionality such as listing creation and trade facility operations is still in progress.

**8\. Challenges Encountered**

**9.Next Sprint (Sprint 2\)**

**10.Conclusion**