Fastnote: Local-First Hybrid Note-Taking
========================================

**Fastnote** is a high-performance, offline-capable note-taking application designed for speed, data integrity, and privacy. Unlike traditional web apps that rely on a constant internet connection, Fastnote implements a **Local-First Architecture**. In this model, the browser's internal database is the primary source of truth, and the cloud acts as a secondary, optional sync engine.

Developed by **Sarthak Ganguly**, this project demonstrates a robust implementation of modern distributed systems patterns on the web.

* * * * *

🏗️ The Architecture: Local-First & Sync-Ready
----------------------------------------------

Fastnote is built to handle the "Flaky Network" reality of modern mobile and web usage.

-   **Primary Storage:** All notes are stored in **IndexedDB** using the **Dexie.js** wrapper. UI updates are optimistic and instantaneous.

-   **Sync Engine:** A background worker polls the local database every 10 seconds for flags (`pending_sync` or `pending_delete`) and synchronizes them with the Flask backend.

-   **Conflict Resolution:** Implements a **Last-Write-Wins (LWW)** strategy using `updated_at` ISO timestamps to ensure the newest data always prevails across devices.

-   **ID Strategy:** Uses **UUIDv4** generated on the frontend to ensure zero ID collisions during offline creation. Includes a cryptographically secure fallback for non-secure (HTTP/IP-based) environments.

* * * * *

🚀 Key Features
---------------

-   **Dual Editors:** Switch seamlessly between a GitHub-flavored **Markdown** editor and an infinite-canvas **Excalidraw** whiteboard.

-   **Pro Sync:** Optional cloud backup for "Pro" users, managed via a dedicated `/api/notes/sync` upsert endpoint.

-   **Hardened Security:** * **XSS Mitigation:** JWTs are stored in `HttpOnly` cookies---completely inaccessible to JavaScript.

    -   **API Shielding:** Every request is validated against strict **Marshmallow** schemas before touching the database.

-   **Production-Ready Backend:** **Nginx** reverse proxy handles routing, while **Gunicorn** with **Gevent** workers manages high-concurrency sync traffic.

-   **Responsive UI:** A clean, dark-mode-ready interface built with **Tailwind CSS**.

* * * * *

🛠️ Tech Stack
--------------

| **Component** | **Technology** |
| --- | --- |
| **Frontend** | React 18, Tailwind CSS, Dexie.js |
| **Database (Local)** | IndexedDB (Browser) |
| **Database (Cloud)** | SQLite (SQLAlchemy ORM) |
| **API Framework** | Flask (Python 3.9) |
| **Validation** | Marshmallow |
| **Proxy / Web Server** | Nginx, Gunicorn (Gevent) |
| **Containerization** | Docker, Docker Compose |

* * * * *

📦 Project Structure
--------------------

Plaintext

```
fastnote/
├── backend/
│   ├── app/
│   │   ├── api/          # Sync, Auth, and Note blueprints
│   │   ├── models/       # UUID-based SQLAlchemy models
│   │   ├── schemas/      # Marshmallow validation schemas
│   │   └── services/     # LWW conflict resolution logic
├── frontend/
│   ├── src/
│   │   ├── db.js         # Dexie/IndexedDB configuration
│   │   ├── components/   # Editor & UI components
│   │   └── pages/        # Local-first HomePage logic
└── proxy/                # Nginx configuration (reverse proxy & WS)

```

* * * * *

🚦 Getting Started
------------------

### Prerequisites

-   Docker & Docker Compose

### Installation & Launch

1.  Clone the repository.

2.  Build and start the services:

    Bash

    ```
    docker-compose up -d --build

    ```

3.  The application will be available at `http://localhost` (or your local network IP).

### Environmental Configuration

Configure the data loss warning interval and API endpoints via the `frontend/.env` and `backend/.env` files.

> **Note:** Accessing via IP (e.g., `192.168.1.100`) triggers the secure-context fallback for UUID generation to ensure the app remains functional in non-HTTPS development environments.

* * * * *

🛡️ Security & Integrity
------------------------

-   **Marshmallow Validation:** Prevents malformed JSON or "Undefined" content types from polluting the sync stream.

-   **Cookie-based Auth:** Eliminates local storage JWT theft risks by utilizing server-side cookie management.

-   **Concurrency:** Optimized for high-frequency polling from multiple local-first clients via asynchronous workers.