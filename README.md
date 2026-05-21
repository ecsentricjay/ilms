# ILMS — Integrated Learning Management System

A full-stack LMS built with React (Vite) + Node.js/Express + Supabase.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios
- **Backend**: Node.js, Express.js
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel (both frontend and backend)

---

## Folder Structure

```
ilms/
├── client/          # React frontend
│   └── src/
│       ├── components/     # Shared UI components
│       ├── context/        # Auth context
│       ├── lib/            # api.js, supabase.js, uploadFile.js
│       └── pages/
│           ├── auth/       # Login, Register
│           ├── student/    # StudentDashboard, StudentCourse
│           ├── lecturer/   # LecturerDashboard, LecturerCourse
│           └── admin/      # AdminDashboard
├── server/          # Express backend
│   ├── lib/         # Supabase client
│   ├── middleware/  # JWT auth middleware
│   └── routes/      # auth, courses, assignments, attendance, results, admin, upload
└── supabase_schema.sql   # Database schema + RLS
```

---

## Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (any name, any region)
3. Wait for the project to initialise (~1 minute)

### Step 2: Set Up the Database

1. In your Supabase dashboard, click **SQL Editor**
2. Paste and run the full contents of `supabase_schema.sql`
3. Verify tables were created under **Table Editor**

### Step 3: Create Storage Buckets

1. Go to **Storage** in the Supabase sidebar
2. Click **New Bucket**:
   - Name: `course-materials` | Toggle **Public: ON**
3. Click **New Bucket** again:
   - Name: `submissions` | Toggle **Public: ON**

### Step 4: Get Your Supabase Credentials

From your Supabase project settings → **API**:
- `Project URL` → goes into `SUPABASE_URL`
- `anon public` key → goes into `VITE_SUPABASE_ANON_KEY`
- `service_role secret` key → goes into `SUPABASE_SERVICE_ROLE_KEY`

---

## Running Locally

### Backend

```bash
cd server
cp .env.example .env
# Fill in your .env values
npm install
npm run dev
```

Server runs at http://localhost:4000

### Frontend

```bash
cd client
cp .env.example .env
# Fill in your .env values
npm install
npm run dev
```

Frontend runs at http://localhost:5173

---

## Environment Variables

### server/.env
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=any-long-random-string
PORT=4000
CLIENT_URL=http://localhost:5173
```

### client/.env
```
VITE_API_URL=http://localhost:4000
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Deploying to Vercel

### Deploy the Backend

1. Push the `server/` folder to a GitHub repository (or a monorepo)
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import the repo; set **Root Directory** to `server`
4. Under **Environment Variables**, add all server `.env` values (plus `CLIENT_URL=https://your-frontend.vercel.app`)
5. Deploy — note the backend URL (e.g. `https://ilms-api.vercel.app`)

### Deploy the Frontend

1. Go to Vercel → **New Project** → import the same repo
2. Set **Root Directory** to `client`
3. Under **Environment Variables**, add:
   - `VITE_API_URL=https://ilms-api.vercel.app` (your backend URL)
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
4. Deploy

---

## Seed Demo Data

The easiest way to seed for your defence demo:

1. Start the app locally
2. Register users via `/register`:
   - 1 admin (role: admin)
   - 2 lecturers (role: lecturer)
   - 3 students (role: student)
3. Log in as a lecturer → create 2 courses
4. Log in as admin → enrol students into courses
5. Log in as lecturer → upload materials, create assignments, record attendance
6. Log in as student → view courses, submit assignments

---

## User Roles

| Role | Access |
|------|--------|
| **Student** | View enrolled courses, download materials, submit assignments, view grades/attendance/results |
| **Lecturer** | Create courses, upload materials, create assignments, grade submissions, record attendance, publish results |
| **Admin** | View all users, activate/deactivate accounts, enrol students into courses |

---

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login

### Courses
- `GET /api/courses` — Lecturer's courses
- `GET /api/courses/enrolled` — Student's enrolled courses
- `POST /api/courses` — Create course (lecturer)
- `GET /api/courses/:id/content` — Get materials
- `POST /api/courses/:id/content` — Upload material (lecturer)
- `GET /api/courses/:id/students` — Enrolled students

### Assignments
- `GET /api/assignments/course/:courseId` — List assignments
- `POST /api/assignments` — Create assignment (lecturer)
- `GET /api/assignments/:id/submissions` — View submissions (lecturer)
- `GET /api/assignments/:id/my-submission` — Own submission (student)
- `POST /api/assignments/:id/submit` — Submit assignment (student)
- `PATCH /api/assignments/submissions/:id/grade` — Grade submission (lecturer)

### Attendance
- `GET /api/attendance/course/:courseId/student` — Student's own attendance
- `GET /api/attendance/course/:courseId` — All attendance (lecturer)
- `POST /api/attendance/record` — Record session (lecturer)

### Results
- `GET /api/results/student` — Student's results
- `GET /api/results/course/:courseId` — Course results (lecturer)
- `POST /api/results` — Publish result (lecturer)

### Admin
- `GET /api/admin/users` — All users
- `PATCH /api/admin/users/:id/status` — Toggle active status
- `GET /api/admin/courses` — All courses
- `GET /api/admin/students` — All students
- `POST /api/admin/enrol` — Enrol student
- `GET /api/admin/enrolments` — All enrolments

### Upload
- `POST /api/upload/signed-url` — Get Supabase Storage upload URL
"# ilms" 
