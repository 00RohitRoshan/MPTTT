# 🎮 Tic-Tac-Toe: Multi-Player Auth (MPTTT)

A high-performance, real-time multiplayer Tic-Tac-Toe game built on the **Nakama** game server. This project implements a fully authoritative server-side architecture to prevent cheating and ensure smooth synchronization across multiple clients.

---

## 🏗️ Architecture & Design Decisions

### 1. Authoritative Server Logic
Unlike peer-to-peer games, all game state management (Board, Turns, Victory) happens strictly in the **Go-based backend**.
- **Anti-Cheat**: Clients only send "Move Requests" (Index). The server validates player identity and move legality before broadcasting any changes.
- **Concurrency**: Based on Nakama's `MatchHandler` interface, every game is isolated in its own process, allowing thousands of simultaneous matches.

### 2. Scalable Technology Stack
- **Backend**: Go (Nakama Runtime) for native performance and low latency.
- **Frontend**: React (Vite) + Framer Motion for a premium, high-frame-rate user experience.
- **Networking**: Real-time WebSockets for sub-10ms state updates.
- **Configuration**: Unified Docker deployment for consistent environments.

---

## 🚀 Setup & Installation

### Prerequisites
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### Local Development Start
1.  **Clone the Repository**
2.  **Start the Server & Frontend**
    ```bash
    docker-compose up --build
    ```
3.  **Access the Game**
    -   Open [http://localhost:7351](http://localhost:7351) in your browser.

---

## ⚙️ Server Configuration

### 1. Match Parameters (`MatchInit`)
- **Tick Rate**: 10Hz (Processes updates 10 times per second).
- **Match Label**: `tictactoe-match` (Used by the matchmaker to peer players).

### 2. Nakama Settings (`local.yml`)
- **API Port**: `7350` (gRPC / JSON API)
- **Console Port**: `7351` (Hosts the Frontend + Admin Tools)
- **Runtime Path**: `/nakama/data/modules/` (Where the Go plugin lives)

---

## 📦 Deployment Process

### Multi-Stage Docker Build
This project uses a unified three-stage build process:
1.  **Go Builder**: Compiles the match handler into a `.so` (Shared Object) plugin.
2.  **Node Builder**: Compiles the React frontend into static assets.
3.  **Production Image**: A lightweight Nakama container that bundles the Go plugin and the Website for native serving.

To prepare for production:
```bash
docker build -t my-game:latest -f backend/Dockerfile .
```

---

## 🎮 How to Test Multiplayer

### Testing Auto-Matchmaking
1.  Open **two separate browser tabs**.
2.  In both tabs, click **"Quick Match"**.
3.  The server will pair both tabs within 1 second.
4.  Play a full game to verify win/loss conditions.

### Testing Private Rooms
1.  **Tab 1**: Click **"Create Private Room"**.
2.  **Tab 1**: Copy the **Room Code** appearing at the top.
3.  **Tab 2**: Paste that code into the **"Enter Room Code"** box and click **"Join with Code"**.
4.  The board will appear immediately on both screens.

### Testing Forfeits
1.  Start a match between two tabs.
2.  On Tab 1, click **"Leave Match"**.
3.  Verify: Tab 2 should immediately show **"VICTORY!"** because the opponent left.

---

## 🛠️ Provided Interfaces (Nakama Go)
- **`runtime.NakamaModule`**: Used for database storage, wallet operations, and match management.
- **`runtime.MatchHandler`**: The core interface implemented for authorizing game logic.
- **`runtime.Dispatcher`**: Used by the server to broadcast state updates to clients.
- **`runtime.Initializer`**: Registers RPCs and Match types during server startup.
