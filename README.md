# Smart Coaching Institute 🎓

A modern web platform for managing a primary coaching institute.  
Built using **React + Node.js + MongoDB**, this system helps students, parents, and teachers interact seamlessly.

---

## 🧠 Project Overview

Smart Coaching Institute is designed specifically for **primary students (Class 1st to 5th)**.  
It focuses on building strong fundamentals in **Maths, English, Hindi and Marathi** with personalized attention.

---

## 🏗️ Architecture
Frontend (React) ⇄ Backend (Node + Express) ⇄ Database (MongoDB)
- React → UI & user interaction  
- Node.js → API & logic  
- MongoDB → data storage  

---

## 🚀 Features

### 👨‍🎓 For Students
- Simple login system (Student / Teacher / Parent roles)
- View courses & institute information
- Book demo classes
- Submit admission/enrollment forms
- Get structured learning experience

---

### 👩‍🏫 For Teacher
- Manage student data
- View enrollments & demo bookings
- Provide structured learning guidance

---

### 👨‍👩‍👧 For Parents
- Track child learning details
- Book demo sessions
- Connect with teacher easily

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- React Router
- Context API
- CSS3 (custom styling)

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

---

## 📂 Project Structure
Coaching_Website/
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ ├── Home.jsx
│ │ │ ├── About.jsx
│ │ │ ├── Faculty.jsx
│ │ │ ├── Login.jsx
│ │ │ ├── Navbar.jsx
│ │ │ └── ...
│ │ ├── assets/
│ │ ├── context/
│ │ ├── services/
│ │ └── index.css
│
├── backend/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ └── server.js
│
└── README.md


---

## ⚙️ Installation & Setup

### 1️⃣ Clone Project
```bash
git clone <your-repo-url>
cd Coaching_Website

2️⃣ Install Dependencies
Backend
cd backend
npm install
Frontend
cd frontend
npm install
3️⃣ Environment Setup

Create .env in backend:

PORT=5001
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key

Create .env.local in frontend:

VITE_API_URL=http://localhost:5001/api
4️⃣ Run Project
Start Backend
cd backend
npm run dev
Start Frontend
cd frontend
npm run dev

👉 App runs at: http://localhost:3000

🎯 Key Pages
Home Page (Hero + Features + Reviews)
About Page (Institute Info + Vision + Mission)
Faculty Page (Teacher Profile)
Login Page (Role-based login)
Demo Booking
Admission Form
🎨 UI Highlights
Clean modern design
Responsive layout
Gradient buttons & cards
Role-based login UI
Interactive sections (cards, animations)"# CoachEdu_institute" 
