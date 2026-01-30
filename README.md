# Analytify – Pomodoro Analytics Dashboard
Analytify is a full-stack Pomodoro productivity analytics platform that helps users track focus sessions, analyze daily productivity trends, and visualize completion efficiency through interactive dashboards.
It combines real-time session tracking, secure authentication, and data-driven analytics using modern web technologies.

## Features
Authentication
User registration & login
JWT-based authentication
Protected routes (frontend + backend)

## Pomodoro Tracking
Start & end Pomodoro focus sessions
Track completed vs abandoned sessionS
Persist session history in database

## Analytics Dashboard
Total sessions overview
Completed vs abandoned session stats

Daily analytics with:
Sessions per day
Total focus time per day
Interactive charts (Bar & Pie)

## Frontend Experience
Modern UI with Tailwind CSS
Responsive design
Clean analytics-focused layout

## Tech Stack
### Frontend
React (Vite)
Tailwind CSS
Recharts (Data visualization)
Axios
React Router DOM

### Backend
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
bcrypt

## Project Structure
```
AnalyticsAllrounder/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── pomodoro.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── PomodoroSession.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── pomodoro.routes.js
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js
│   │   ├── components/
│   │   │   ├── AnalyticsChart.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── Timer.jsx
│   │   │   ├── History.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Focus.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

## API Endpoints
### Auth Routes
```
POST   /api/auth/register
POST   /api/auth/login
```

### Pomodoro Routes (Protected)
```
POST   /api/pomodoro/start
POST   /api/pomodoro/end
GET    /api/pomodoro/stats
GET    /api/pomodoro/dailystats
```
## Sample API Responses
### `/api/pomodoro/stats`
```json
{
  "totalSessions": 22,
  "completed": 4,
  "abandoned": 17
}
```

### `/api/pomodoro/dailystats`
```json
[
  { "date": "2026-01-11", "sessions": 2, "focusTime": 40 },
  { "date": "2026-01-29", "sessions": 2, "focusTime": 0 }
]
```

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/AnalyticsAllrounder.git
cd AnalyticsAllrounder
```

---

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Run backend:
```bash
npm run dev
```

---

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
```
http://localhost:5173
```

Backend runs on:
```
http://localhost:5000
```


## Security Notes
Passwords are hashed using bcrypt
JWT tokens used for protected routes
Backend routes secured via middleware

## Future Enhancements
Weekly / monthly analytics filters
Export analytics as CSV
User streak tracking
Dark / light theme toggle
Mobile-first analytics view

👨‍💻 Author
Deep Moitra
B.Tech AIML | Frontend & Full-Stack Developer
📧 Email: deepmoitra2@gmail.com
📱 Phone: 7319824670
🌐 Portfolio: https://deep-moitra-mauve.vercel.app/
💻 GitHub: https://github.com/triggereddown
🔗 LinkedIn: https://www.linkedin.com/in/deep-moitra-59202a1a5/

⭐ Final Note
This project demonstrates real-world full-stack engineering:
Clean backend architecture
Analytics-driven frontend
Proper API design
Production-ready folder structure
