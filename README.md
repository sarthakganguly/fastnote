# Fastnote - A Modern, Self-Hosted Note-Taking Application

![Fastnote](https://img.shields.io/badge/fastnote-v1.0.0-blueviolet)
![Python](https://img.shields.io/badge/Python-3.9-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Docker](https://img.shields.io/badge/Docker-Powered-2496ED)

Fastnote is a full-stack, self-hosted web application that allows you to create, manage, and search for notes using a powerful Markdown editor or an infinite Excalidraw canvas. It is designed to run locally on your own server using Docker, ensuring your data remains private and under your control.

---

## Features

-   **Secure User Authentication:** Sign up with a username and password, with secure login sessions.
-   **Dual Note Editors:**
    -   **Markdown:** A feature-rich editor with a live preview for text-based notes.
    -   **Excalidraw Canvas:** A virtual whiteboard for diagrams, sketches, and visual thinking.
-   **Complete Note Management:**
    -   Create, edit, and delete notes from a responsive side panel.
    -   Auto-saving functionality for a seamless workflow.
-   **Full-Text Search:** Quickly find the note you're looking for by searching titles.
-   **Responsive Design:** A clean and modern UI that works on both desktop and mobile devices.
-   **Theming:** A beautiful dark theme is enabled by default, with a toggle for a light theme.
-   **Data Portability:** Easily export all your notes to a single JSON file for backup and import them back into the application at any time.
-   **100% Self-Hosted:** All components run in Docker containers on your local server, and all data is stored in a local SQLite database.

---

## Tech Stack

This project is built with a modern, containerized architecture.

| Category          | Technology                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| **Backend**       | Python, Flask, Gunicorn, Flask-SQLAlchemy                                                            |
| **Frontend**      | React, React Router, Axios, Tailwind CSS                                                             |
| **Note Editors**  | `@uiw/react-md-editor`, `@excalidraw/excalidraw`                                                      |
| **Database**      | SQLite (for simplicity and local storage)                                                            |
| **Containerization** | Docker & Docker Compose                                                                              |

---

## Project Structure

The project uses a monorepo structure with a clean separation between the frontend and backend services.

```
fastnote/
│
├── .gitignore               # Specifies which files and folders to ignore for Git version control.
├── docker-compose.yml       # The master file to build and run the entire application with Docker.
└── README.md                # The detailed project documentation.
│
├── backend/
│   ├── .flaskenv            # Environment variables for the Flask CLI (e.g., for migrations).
│   ├── Dockerfile           # Instructions to build the Python backend Docker image.
│   ├── requirements.txt     # A list of all Python package dependencies.
│   └── app/
│       ├── __init__.py      # Makes the 'app' directory a Python package.
│       ├── database.py      # SQLAlchemy setup and database initialization logic.
│       ├── main.py          # The Flask application factory; ties everything together.
│       ├── models.py        # Defines the User and Note database tables (schema).
│       └── api/
│           ├── __init__.py  # Makes the 'api' directory a Python package.
│           ├── auth.py      # API endpoints for user signup and login.
│           └── notes.py     # API endpoints for CRUD operations on notes.
│
└── frontend/
    ├── .env                 # Environment variables for React (e.g., the backend API URL).
    ├── Dockerfile           # Instructions to build the React frontend Docker image.
    ├── package.json         # Lists all Node.js dependencies and project scripts.
    ├── postcss.config.js    # Configuration for PostCSS (used by Tailwind).
    ├── tailwind.config.js   # Configuration file for Tailwind CSS.
    │
    ├── public/
    │   ├── index.html       # The main HTML page that the React application is injected into.
    │   └── manifest.json    # Provides application metadata for PWAs.
    │
    └── src/
        ├── App.js           # The main React component, handles routing and authentication context.
        ├── index.css        # Global CSS styles and Tailwind CSS directives.
        ├── index.js         # The entry point for the React application.
        │
        ├── components/      # Reusable UI components.
        │   ├── ExcalidrawEditor.js
        │   ├── Header.js
        │   ├── MarkdownEditor.js
        │   ├── NoteItem.js
        │   ├── NoteList.js
        │   ├── ThemeToggle.js
        │   └── WelcomeScreen.js
        │
        └── pages/           # Top-level components for each application page/route.
            ├── HomePage.js
            ├── LoginPage.js
            └── SignupPage.js

# Note: The following directories are created at runtime and are correctly ignored by .gitignore:
#
# fastnote/data/                     # Created by Docker Compose to persist the SQLite database file.
# fastnote/backend/instance/         # Created by Flask to store the database and other instance-specific files.

```

## Getting Started

Follow these instructions to get the application running on your local server.

### Prerequisites

-   A machine running a Linux-based OS (e.g., Ubuntu Server).
-   [Docker](https://docs.docker.com/engine/install/) installed.
-   [Docker Compose](https://docs.docker.com/compose/install/) installed.
-   Git (for cloning the repository).

### 1. Clone the Repository
```bash
git clone git@github.com:sarthakganguly/fastnote.git
cd fastnote
```

### 2. Configure the Frontend Environment

This is the most crucial configuration step. The React frontend (which runs in your web browser) needs to know the network address of the Python backend server. We will provide this address via an environment file.

#### 2.1 Find the Server's IP Address

You need the IP address of the machine where the Docker containers are running (your ThinkPad server).

On your Ubuntu server, run the following command to find its local network IP:
```bash
hostname -I | awk '{print $1}'
```

### 2. Configure the Frontend Environment

This is the most crucial configuration step. The React frontend (which runs in your web browser) needs to know the network address of the Python backend server. We will provide this address via an environment file.

#### 2.1 Find the Server's IP Address

You need the IP address of the machine where the Docker containers are running (your ThinkPad server).

On your Ubuntu server, run the following command to find its local network IP:
```bash
hostname -I | awk '{print $1}'
```

The output will be an IP address like `192.168.1.XX` or `10.0.0.XX`. This is your `SERVER_IP`.

> **Note:** If you are running both your browser and the Docker containers on the *same desktop machine* (e.g., your local development laptop), you can use `localhost` instead of the IP address.

#### 2.2 Create the Environment File

Create a new file named `.env` inside the `frontend` directory.
```bash
# From the root fastnote/ directory:
touch frontend/.env
```

### 2.3 Add the API URL to the .env File

Open the newly created `frontend/.env` file with a text editor (like `nano` or VS Code) and add the following line.

**Important:** You must replace `YOUR_SERVER_IP` with the actual IP address you found in step 2.1.

```env
REACT_APP_API_BASE_URL=http://YOUR_SERVER_IP:5000
```

**Example 1 (Server Setup):**
If your server's IP address is `192.168.1.55`, the file content should be:
```env
REACT_APP_API_BASE_URL=http://192.168.1.55:5000
```

**Example 2 (Local Desktop Setup):**
If you are running everything on your main PC (not a separate server), you can use `localhost`:
```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

This file is critical as it tells the React application running in your browser where to send its API requests to communicate with the backend.

### 3. Build and Run the Application

With the environment configured, starting the entire application is a single command. From the root `fastnote/` directory, run:

```bash
docker-compose up --build
```

-   `--build`: This flag is essential. It tells Docker Compose to build the application images, including your new `.env` file, before starting them.
-   To run the application in the background (detached mode), you can add the `-d` flag: `docker-compose up --build -d`.

### 4. Access Fastnote

After the build process is complete and the containers are running, wait about 30-40 seconds for the servers to fully initialize.

Then, open a web browser on a device **on the same network** as your server and navigate to:

`http://<YOUR_SERVER_IP>:3000`

(Or `http://localhost:3000` if you are on the same desktop machine).

You should now see the Fastnote login screen, and the application will be fully functional.