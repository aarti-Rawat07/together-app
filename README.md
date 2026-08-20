# Together ❤️ - Private Duo Real-Time Connection Platform

> *"I can't physically be with this person, but Together lets us spend time together as if we are in the same room."*

**Together** is a private, real-time web platform designed specifically for two people (partners, best friends, or family) who are physically distant but want an intimate, shared digital room.

---

## 🌟 Key Features

* **Strict Two-Person Rooms (❤️ Only 2 People)**:
  * Backend and WebSocket layer enforce `max_participants = 2`.
  * Third-party users are strictly rejected with clean authorization errors.
  * Rooms are identified with secure UUID tokens.
* **🎵 Synchronized Music Player**:
  * Shared playback across both clients with sub-second drift compensation.
  * Real-time sync for Play, Pause, Seek, and Track Switching.
  * Bundled catalog of royalty-free ambient and lo-fi audio tracks with visual vinyl disc rotation.
  * Extensible `MusicProvider` abstraction layer.
* **🎤 WebRTC Voice Chat**:
  * Peer-to-peer audio connection with FastAPI WebSocket signaling.
  * Web Audio API volume visualizer detecting real-time voice activity.
  * Microphone mute/unmute and live call status.
* **💬 Real-Time Persistent Chat**:
  * Instant bidirectional messaging powered by WebSockets.
  * SQLite/PostgreSQL database persistence.
  * Real-time typing indicators.
* **✨ Animated Floating Reactions**:
  * Send floating reactions (`❤️`, `😂`, `😍`, `👍`, `🎉`, `😭`) that drift upward across both screens in real time.
* **🟢 Live Presence & Status**:
  * Real-time partner status: Online, In Room, Reconnecting, or Offline.
* **👥 Contact & Invitation System**:
  * User lookup by username or email.
  * Connection requests with Accept/Reject controls.
* **🔔 In-App Notifications**:
  * Live alerts for incoming requests, accepted invitations, and room sessions.

---

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Together Client                      │
│        (React 18 + TypeScript + Vite + Tailwind)       │
└──────────────┬───────────────────────────┬─────────────┘
               │ HTTP REST                 │ WebSockets & WebRTC Signaling
               ▼                           ▼
┌────────────────────────────────────────────────────────┐
│                   FastAPI Backend                      │
│             (Python 3.11+ / Uvicorn)                   │
├────────────────────────────────────────────────────────┤
│  • JWT Auth & Bcrypt Security                          │
│  • Strict 2-Member Room Validation Engine              │
│  • RoomConnectionManager (WebSockets)                  │
│  • Royalty-Free Local Audio Provider                   │
│  • Async SQLAlchemy ORM (SQLite / PostgreSQL)          │
└────────────────────────────────────────────────────────┘
               │                           │
               ▼ P2P MediaStream           ▼
    ┌─────────────────────┐     ┌────────────────────────┐
    │  WebRTC Voice Peer  │     │ Database (SQLite / PG) │
    └─────────────────────┘     └────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with dark romantic palette & glassmorphism
- **Routing**: React Router v6
- **Real-Time Communication**: Native WebSocket API & WebRTC `RTCPeerConnection`
- **Audio**: HTML5 Audio API + Web Audio API `AudioContext` & `AnalyserNode`
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Database ORM**: SQLAlchemy 2.0 (Async with `aiosqlite`)
- **Authentication**: JWT (`pyjwt`) with Bcrypt password hashing
- **WebSockets**: Native FastAPI WebSockets with custom connection manager
- **Validation**: Pydantic v2
- **Testing**: Pytest, Pytest-Asyncio, HTTPX

---

## 📁 Project Structure

```text
together/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint, CORS, lifespan
│   │   ├── config.py             # App configuration & settings
│   │   ├── database.py           # Async SQLAlchemy engine & session
│   │   ├── auth/
│   │   │   ├── security.py       # Password hashing & JWT creation
│   │   │   └── dependencies.py   # Auth dependencies for REST & WS
│   │   ├── models/               # SQLAlchemy models (User, Contact, Room, Message, Notification)
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── routers/              # API endpoints (auth, users, contacts, rooms, ws, music, notifications)
│   │   ├── services/             # MusicProvider & Room services
│   │   └── websocket/
│   │       └── manager.py        # 2-Person RoomConnectionManager
│   ├── static/music/             # Curated royalty-free demo tracks
│   ├── tests/                    # Pytest backend test suite
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/           # UI components (MusicPlayer, VoiceChat, RoomChat, Avatar, etc.)
│   │   ├── pages/                # Pages (Login, Register, Dashboard, Contacts, Room, NotFound)
│   │   ├── hooks/                # Hooks (useWebSocketRoom, useSynchronizedAudio, useWebRTC)
│   │   ├── context/              # AuthContext, NotificationContext
│   │   ├── services/             # Axios API services
│   │   └── types/                # TypeScript interfaces
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+)

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Generate royalty-free demo tracks
python generate_demo_music.py

# Run development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be available at: `http://localhost:8000`  
Swagger API Docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`

---

## 🐳 Running with Docker

You can run the entire stack with a single command:

```bash
docker compose up --build
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`

---

## 🧪 Running Automated Tests

Run the complete backend test suite:

```bash
cd backend
.\venv\Scripts\pytest -v
```

Tests cover:
- User registration, duplicate prevention, and bcrypt password verification
- JWT login and authenticated route protection
- Contact request, auto-acceptance, rejection, and removal
- Private room creation between accepted contacts
- **Strict 2-person room enforcement: blocking third-party users with 403 Forbidden**
- Real-time WebSocket connection manager and 2-person capacity checks

---

## 📖 Manual Testing Guide

Follow these steps to experience the complete Together flow:

1. **Open two browser windows**:
   - Window 1: `http://localhost:5173` (e.g. Chrome)
   - Window 2: `http://localhost:5173` (e.g. Chrome Incognito)

2. **Register User A (Window 1)**:
   - Name: `Aarti Sharma`
   - Username: `aarti`
   - Email: `aarti@together.app`
   - Password: `Password123!`

3. **Register User B (Window 2)**:
   - Name: `Rohan Verma`
   - Username: `rohan`
   - Email: `rohan@together.app`
   - Password: `Password123!`

4. **Connect Contact**:
   - In Window 1, go to **Contacts**, search for `rohan`, and click **Connect**.
   - In Window 2, navigate to **Contacts** -> **Incoming Requests** and click **Accept**.
   - Both users are now paired as **Duo Partners ❤️**.

5. **Start Together Session**:
   - In Window 1, click **Start Together Session**.
   - In Window 2, click the **Rejoin / Together Session Started** notification banner.

6. **Test Features**:
   - **🎵 Music Sync**: Hit **Play** in Window 1 — both windows play the same track in sync. Seek or change tracks from the library — both windows update in real time.
   - **🎤 Voice Chat**: Click **Start Voice Chat** to begin WebRTC audio calling with live speech visualizer waveforms.
   - **💬 Chat & Reactions**: Send real-time chat messages and tap reaction emojis (`❤️`, `😂`, `🔥`) to see floating physics animations on both screens.
   - **🔒 Security Verification**: Open a 3rd incognito tab, register as User C, and try navigating directly to the room URL (`http://localhost:5173/room/<uuid>`). Verify that User C is instantly blocked with **"Access Denied: Room is private or full"**.

---

## 📄 License

MIT License. Built with love ❤️ for real-time human connection.
