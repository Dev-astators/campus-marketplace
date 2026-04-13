**Project Plan — Campus Marketplace**

---

# **1\. Project Overview**

The Campus Marketplace is a web-based peer-to-peer trading platform designed exclusively for university students. The system enables students to securely buy, sell, and trade items within a trusted campus environment, supported by a structured trade facility for safe item exchange.

The platform integrates authentication, listings, messaging, payments, and analytics to create a complete digital marketplace experience.

# **2\. Objectives**

* Enable students to create and browse listings  
* Provide a secure authentication system  
*  Support safe item exchange via trade facility workflows  
* Allow communication between buyers and sellers  
* Enable payment tracking and transaction management  
* Provide analytics dashboards for system insights

# **3\. System Roles**

Student:  
 \- Create, browse, and manage listings  
 \- Buy, sell, and trade items  
 \- Communicate with other users

 Trade Facility Staff:  
 \- Manage item drop-off and collection  
 \- Confirm transaction completion  
 \- Track payment settlement

 Admin:  
 \- Configure system settings  
 \- Manage platform operations  
 \- Monitor analytics and moderation

# **4\. Technology Stack**

### **Frontend**

* React (Vite)  
* Tailwind CSS

### **Backend**

* Node.js  
* Express.js

### **Backend Services**

* Supabase (authentication and database integration)

### **Tools**

* GitHub (version control \+ CI/CD)  
* Trello (Scrum task management)

# **5\. Justification of Technology Choices**

### **React (Vite)**

* Enables fast development and hot reloading  
* Supports component-based architecture  
* Scales well for complex UI systems

### **Tailwind CSS**

* Allows rapid UI development  
* Ensures consistent styling across components  
* Supports responsive design

### **Node.js \+ Express**

* Lightweight backend for API development  
* Supports RESTful architecture  
* Easily integrates with frontend

### **Supabase**

* Provides built-in authentication  
* Simplifies database management  
* Reduces backend complexity

### **GitHub**

* Enables collaboration and version tracking  
* Supports CI/CD pipelines  
* Required for sprint evaluation

# **6\. System Architecture**

Client-server architecture:  
React Frontend → Express API → Supabase (Auth \+ Database)

# **7\. Agile Methodology**

The project follows Scrum:

* Work divided into **sprints (2 weeks)**  
* Features defined as **user stories**  
* Tasks tracked using **Trello**

Meetings include:

* Sprint Planning  
* Daily Scrums  
* Sprint Review  
* Sprint Retrospective

# **8\. Product Backlog Summary**

| ID | Feature |
| :---- | :---- |
| US1 | User Authentication |
| US2 | Listings Management |
| US3 | Trade Facility Management |
| US4 | Messaging System |
| US5 | Payment Integration |
| US6 | Rating System |
| US7 | Analytics Dashboard |

# **9\. Sprint Planning Approach**

Sprint 1:

* Authentication  
* UI structure  
* Routing setup

Sprint 2: 

* Listings  
*  Backend API integration  
*  Architecture documentation(UML)


**10\. Risk Management**

Integration issues, time constraints, and team coordination challenges mitigated through planning and testing.

# **11\. CI/CD Strategy**

* GitHub used for version control  
* Frequent commits required  
* CI/CD pipeline configured using GitHub Actions  
* Ensures build and test validation on each push

# **12\. Test Strategy**

* User Acceptance Tests (Given–When–Then)  
* Unit tests (planned for backend services)  
* Integration tests (frontend ↔ backend)

# **13\. Future Enhancements**

* ML-based price suggestion system  
* Recommendation engine  
* Fraud detection indicators  
* Push notifications  
* Mobile optimisation

# **14\. Conclusion**

The Campus Marketplace project is built using a scalable architecture and modern web technologies. By following Agile methodology and structured development practices, the system is designed to evolve incrementally across sprints, ensuring continuous delivery of functional features and improvements.

