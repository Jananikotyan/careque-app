# CareQueue - Hospital Appointment and Queue Management System

A complete full-stack modern healthcare system featuring real-time queue management, AI slot recommendations, and a premium aesthetic.

## Architecture & Tech Stack

**Frontend:** React.js, Vite, Tailwind CSS, React Router, Framer Motion, GSAP, Socket.IO Client.
**Backend:** Node.js, Express.js, MVC Pattern.
**Database:** Supabase PostgreSQL.
**Cache/Queue:** Redis.
**Real-Time:** Socket.IO.

### Core Architecture Flow

1. **Authentication:** JWT tokens issued on login/register.
2. **Booking:** Client requests a slot. Backend uses Redis Distributed Lock (`setnx`) to prevent double-booking. Once secured, it inserts into Supabase and pushes the ID to a Redis FIFO queue.
3. **Queue Updates:** When a patient is added to the queue, or the doctor completes/cancels an appointment, a `queue_updated` event is broadcasted via Socket.IO to the specific doctor's room.
4. **Automated Emails:** Upon successful booking, Nodemailer triggers an HTML email receipt to the patient.
5. **AI Chatbot (MediBot):** A floating AI triage assistant powered by OpenAI guides patients based on symptoms.
6. **AI Recommendations:** Backend simulates analyzing historical data (cancellations, delays) to score available slots.

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- A Supabase Project (PostgreSQL)
- Redis Server (Local or Docker)

### 1. Database Setup
Run the SQL script found in `schema.sql` in your Supabase SQL Editor to create the necessary tables.

### 2. Environment Variables
In `backend/`, copy `.env.example` to `.env` and fill it out:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
AI_API_KEY=your_ai_key
PORT=5000
```
In `frontend/`, edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Running Locally
Start Redis (if using Docker):
`docker run -p 6379:6379 -d redis`

Start Backend:
```bash
cd backend
npm install
npm run start
```

Start Frontend:
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `POST /api/auth/register` - Register Patient/Doctor
- `POST /api/auth/login` - Login
- `POST /api/appointments` - Book appointment
- `GET /api/doctors/:doctor_id/queue` - Get doctor's queue
- `PATCH /api/appointments/:appointment_id/status` - Update status (in_progress, completed, cancelled)
- `GET /api/doctors/:doctor_id/next` - Call next patient from Redis
- `DELETE /api/appointments/:appointment_id` - Cancel appointment
- `GET /api/doctors/:doctor_id/slots?date=YYYY-MM-DD` - Get available slots
- `GET /api/doctors/:doctor_id/recommendations` - Get AI recommendations

## Database Schema (PostgreSQL)
- **patients:** id (UUID), name, email, password_hash
- **doctors:** id (UUID), name, specialty, email, password_hash
- **appointments:** id (UUID), patient_id, doctor_id, appointment_date, start_time, status, queue_position

## Redis Usage
- **FIFO Queue:** Stored in `doctor:queue:{doctor_id}` using `rpush` and `lpop`.
- **Locking:** `lock:doctor:slots:{doctor_id}:{date}:{time}` using `setnx` to enforce concurrency control during booking.
