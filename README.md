Testing
# 📚 CampusNotes – University Notes Sharing Platform

CampusNotes is a full-stack university notes-sharing web application designed to help students easily find, upload, and download academic resources in one organized place. The platform allows students to access past papers, lecture notes, and study materials sorted by semester and subject.

It is built as a simple digital library to improve collaboration and make exam preparation easier for students.

---

## 🚀 Features

- 🔐 User authentication (Email + Google Login)
- 📂 Upload and download PDF notes
- 📚 Browse notes by semester and subject
- 🔎 Search functionality for quick access
- 👤 Role-based system (Free & Premium users)
- 💳 Paid plan logic with feature restrictions
- ☁️ Cloud file storage using Cloudinary
- ⚡ Clean and responsive UI design

---

## 🛠️ Tech Stack

- Frontend: React / HTML / CSS / JavaScript  
- Backend: Node.js, Express.js  
- Database: MongoDB  
- Authentication: Google OAuth + JWT  
- File Storage: Cloudinary  
- Other Tools: Cursor AI (development assistant)

---

## 🧠 What I Learned

### 🔐 Google Authentication
Implemented secure login using Google OAuth via Google Cloud Console.  
This allowed users to sign in with a single click for better user experience.

---

### 💳 Pricing Plan Logic
Designed and implemented free vs premium user rules:
- Free users have limited access/downloads
- Premium users get full access

---

### ☁️ Cloudinary Integration
Learned cloud-based file storage instead of local uploads:
- Uploaded PDFs stored on Cloudinary
- URLs saved in database for fast access
- Improved scalability and performance

---

### 🎨 UI/UX Design Process
Before coding, I:
- Researched 10–15 UI designs (Figma inspiration)
- Sketched my own layout on paper
- Converted sketches into actual web pages

This helped maintain a clear and structured UI flow.

---

### 🧩 Frontend Organization
Structured frontend into:
- Pages
- Components
- Reusable UI elements

This made the code clean, modular, and easy to maintain.

---

### 🧠 Backend Architecture
Organized backend using:
- Routes
- Controllers
- Models
- Middleware

This improved scalability and separation of concerns.

---

### 🐞 Filtering System Fix
Fixed an issue in notes filtering by semester and subject, improving search accuracy and user experience.

---

### 🤖 Development Assistance (Cursor AI)
Used Cursor AI as a development assistant for:
- Debugging errors
- Explaining code
- Improving logic
- Speeding up repetitive tasks

All design decisions and core logic were implemented by me.

---

## 📦 Project Structure
CampusNotes/
│
├── client/ (Frontend)
├── server/ (Backend)
├── models/
├── routes/
├── controllers/
├── middleware/
├── uploads/ (if used locally)
└── README.md


---

## 📈 Future Improvements

- Chat system between students
- Advanced search filters
- Mobile app version
- Admin dashboard
- Analytics for uploads/downloads

---

## 👨‍💻 Author

**AbubakarTechy**

---

## ⭐ Purpose

This project was built as a learning + practical university project to understand full-stack development, authentication systems, file storage, and scalable web architecture.
