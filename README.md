# WitzClass 🎓 — No More Excuses

> The smart assignment collector that eliminates "I forgot my assignment at home."

## What is WitzClass?

WitzClass is a focused assignment collection platform — not a bloated LMS. It solves one real problem: students forgetting or losing assignments. Teachers post assignments, students submit digitally (files, images of handwritten work, or typed answers), and teachers grade at their leisure.

## Who is it for?

| Role | What they do |
|------|-------------|
| 🏫 **School Admin** | Registers school, gets school code, manages teachers & classrooms |
| 👨‍🏫 **Teacher** | Joins school, creates classrooms with join codes, posts assignments, grades |
| 🧑‍💻 **Independent Tutor** | Works solo without a school, creates classrooms directly |
| 🎒 **Student** | Joins classroom with code, submits assignments, gets grades & feedback |

## Key Features

- 🔑 **Join Codes** — Students join classrooms using a `WTZ-XXXXX` code
- 🏫 **School System** — Schools register with a code teachers use to join
- 📤 **Flexible Submissions** — PDF, Word docs, images (handwritten work), or typed text
- ⏰ **Deadline Control** — Auto-lock on deadline, or teacher manually closes
- ⚠️ **Late Submissions** — Teacher decides if late work is accepted (marked as late)
- 📊 **Who Hasn't Submitted** — Teachers see exactly who is missing
- 🎯 **Grading** — Score + percentage + letter grade (A+, A, B+...) + written feedback
- 🔔 **Real-time Notifications** — WebSocket-powered instant alerts

## Tech Stack

- **Frontend**: React 18, React Router v6, Axios
- **Backend**: Django 4.2, Django REST Framework, SimpleJWT
- **Real-time**: Django Channels (WebSocket)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Deployment**: Vercel (frontend) + Render (backend)

## Getting Started Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Deployment

- **Backend**: Render.com — Root: `backend`, Build: `./build.sh`, Start: `daphne -b 0.0.0.0 -p $PORT witzclass.asgi:application`
- **Frontend**: Vercel — Root: `frontend`, Framework: Create React App, Env: `REACT_APP_API_URL=https://your-render-url.onrender.com/api`
