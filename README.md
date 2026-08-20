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

