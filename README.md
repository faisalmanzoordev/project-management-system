# Full-Stack Project Management Workspace Portal

A robust, enterprise-grade project management application featuring an interactive front-end dashboard built with **React, TypeScript, and Tailwind CSS v4**, seamlessly integrated with a secure, scalable **.NET Core Web API** backend and SQL Server.

## 🔗 Live Deployments & Repository Links
* **Live Production Frontend:** [https://taskgrid-portal.netlify.app](https://taskgrid-portal.netlify.app)
* **Live Backend Swagger Documentation:** [https://your-plesk-domain.com/swagger](https://your-plesk-domain.com/swagger)
* **GitHub Repository:** [https://github.com/YOUR_USERNAME/ProjectManagement-FullStack](https://github.com/YOUR_USERNAME/ProjectManagement-FullStack)

---

## 🚀 Key Feature Sets

### 1. Unified Workspace & Project Architecture
* Dynamic hierarchy where multiple Projects belong to dedicated Workspaces.
* Cross-origin client synchronization using customized `.NET Core CORS Middleware`.

### 2. Multi-View Task Boards (CRUD)
* **Table View:** Comprehensive tabular grid detailing assignees, priority badges, and explicit target deadlines.
* **Kanban Board View:** Status-segregated lanes ("To Do", "In Progress", "Done") to visualize project lifecycle states.
* **Calendar View:** An interactive grid that filters and plots upcoming tasks onto their exact deadline calendar boxes.

### 3. Nested Subtasks System
* Self-referencing database hierarchy supporting parent-child task models.
* Modal-driven checklist controls to view, create, and toggle subtasks without leaving the workspace screen.

### 4. Advanced Security & Interoperability
* **Secure Authentication:** State-tracked login pipeline powered by cryptographically verified JWT Bearer Tokens.
* **One-Way Hashing:** Production-ready database security utilizing the **BCrypt** algorithm to hash user credentials.

---

## 📸 System Snapshots & UI Highlights

### Interactive Workspace Dashboard (Table View)
![Workspaces Dashboard Overview](https://taskgrid-portal.netlify.app/assets/snapshots/table-view.png)
*Alternative Local Path Reference: `project-management-ui/src/assets/snapshots/table-view.png`*

### Agile Kanban Lifecycle Lanes
![Kanban Status Management](https://taskgrid-portal.netlify.app/assets/snapshots/kanban-view.png)
*Alternative Local Path Reference: `project-management-ui/src/assets/snapshots/kanban-view.png`*

### Secure API Layer & JWT Token Authorize Controller
![Swagger API Documentation Architecture](https://taskgrid-portal.netlify.app/assets/snapshots/swagger-ui.png)
*Alternative Local Path Reference: `project-management-api/snapshots/swagger-ui.png`*

---

## 🛠️ Technical Stack Matrix

| Architecture Layer | Technologies & Libraries Utilized |
| :--- | :--- |
| **Frontend UI Client** | React 18, TypeScript, Tailwind CSS v4, Axios, React Router v6 |
| **Backend Web API** | .NET Core Web API, Entity Framework Core |
| **Security Layer** | JWT (JSON Web Tokens) Bearer Auth, BCrypt.Net-Next |
| **Database Engine** | Microsoft SQL Server |
| **Production Hosting** | Netlify (Frontend Drop), Plesk Windows Server (Backend System) |

---

## ⚙️ Local Development Environment Setup

### Prerequisites
* [.NET SDK 8.0+](https://dotnet.microsoft.com/download)
* [Node.js v18+ & npm](https://nodejs.org/)

### 1. Backend Server Setup
Navigate into the backend project subfolder:
```bash
cd project-management-api
