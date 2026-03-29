# Fastnote: Production-Ready Personal Whiteboard & Knowledge Base

![Fastnote](https://img.shields.io/badge/fastnote-v1.2.0-blueviolet)
![Python](https://img.shields.io/badge/Python-3.9-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Clean Architecture](https://img.shields.io/badge/Architecture-Clean-green)

Fastnote is a high-performance, self-hosted note-taking application designed for privacy and visual thinking. It combines a professional **Markdown editor** with an infinite **Excalidraw canvas**, allowing you to bridge the gap between structured text and freeform diagrams.

The system is built on **Clean Architecture** principles, ensuring that business logic is decoupled from frameworks, making it easy to maintain, test, and scale.

---

## 🚀 Key Features

-   **Dual-Engine Editing:**
    -   **Markdown:** Full-featured text editor with live preview for documentation and journaling.
    -   **Excalidraw Canvas:** Infinite whiteboard for sketches, system architecture diagrams, and mind maps.
-   **Clean Architecture Backend:** Highly modular Python/Flask backend using Service-Layer patterns.
-   **Production-Grade Stack:** Powered by Gunicorn with Gevent workers and `--preload` for high concurrency.
-   **Structured Observability:** Centralized logging and error handling for predictable debugging.
-   **Data Portability:** Full JSON import/export functionality to prevent vendor lock-in.
-   **Privacy First:** 100% self-hosted; your data never leaves your ThinkPad/Server.
-   **Responsive Dark Mode:** Optimized for late-night engineering sessions.

---

## 🏗 System Architecture

The project follows a modular structure to ensure a separation of concerns:

### Backend Structure (`backend/app/`)
-   **`/core`**: Configuration management (12-factor app), security decorators, and global exception handlers.
-   **`/models`**: Data layer using SQLAlchemy (Modular folder approach).
-   **`/services`**: Pure business logic. This layer knows *how* to create notes and users but knows *nothing* about Flask or HTTP.
-   **`/api`**: Controllers/Routes. Handles request parsing and maps service responses to JSON.

### Frontend Structure (`frontend/src/`)
-   **`/components`**: Atomic UI components (Editors, Lists, Toggles).
-   **`/pages`**: Top-level route components.
-   **Centralized State**: Auth context and protected routing logic.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Python 3.9+, Flask 3.x, Gunicorn, Gevent, SQLAlchemy |
| **Frontend** | React 18, Tailwind CSS, Axios, @excalidraw/excalidraw |
| **Database** | SQLite (Persisted via Docker Volumes) |
| **DevOps** | Docker, Docker Compose, 12-Factor Config |

---

## ⚡ Quick Start

### 1. Configure Networking (Critical)
Since the frontend executes in your browser, it needs the **actual network IP** of your server (e.g., your ThinkPad) to communicate with the backend.

1.  **Find your Server IP:**
    ```bash
    hostname -I | awk '{print $1}'
    # Let's assume the output is 192.168.1.100
    ```
2.  **Update Configuration:**
    Open `docker-compose.yml` and set the IP in the `frontend` service:
    ```yaml
    frontend:
      environment:
        - REACT_APP_API_BASE_URL=http://192.168.1.100:5000
    ```
    *Also ensure `frontend/.env` matches this value.*

### 2. Deploy with Docker
Run the following command from the root directory:

```bash
# Build and start in detached mode
docker-compose up -d --build
```

### 3. Initialize the App
Access Fastnote in your browser:
`http://192.168.1.100:3000`

> **Note:** Since the database initializes empty on the first run, go to the **Signup** page to create your primary account.

---

## 🔧 Maintenance & Debugging

### View Structured Logs
Monitor backend performance and access logs in real-time:
```bash
docker compose logs -f backend
```

### Force a Clean Rebuild
If you change environment variables or structural packages:
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database Persistence
The SQLite database is stored in a named Docker volume (`sqlite_data`). It persists even if containers are destroyed. To find the physical location on your host machine:
```bash
docker volume inspect fastnote_sqlite_data
```

---

## 🛡 Security & Configuration

Fastnote uses **JWT (JSON Web Tokens)** for stateless authentication.
-   Default token expiration: **24 Hours**.
-   **IMPORTANT:** Change the `SECRET_KEY` in `docker-compose.yml` before deploying to a public-facing network.

---

## 📝 License
MIT - Created for self-hosters and visual thinkers.