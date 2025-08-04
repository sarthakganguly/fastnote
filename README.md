# FastNote - A Local-First, Privacy-Focused Note-Taking App

FastNote is a lightweight, self-hosted web application for writing and storing notes on your local device. It is designed for individuals who value data privacy and want a simple, powerful tool for personal knowledge management without relying on cloud services.

All data, including user information, notes, and tags, is stored in a local SQLite database on the device running the application.

## Features

-   **100% Local & Private:** No cloud storage. All your notes are stored locally.
-   **User Authentication:** Secure sign-up and sign-in system for personal use.
-   **Markdown Support:** Write notes in Markdown and view them as rendered HTML.
-   **Powerful Tagging System:** Organize notes with colorful, clickable tags (`#tag`).
-   **Advanced Search:**
    -   Live full-text search across all notes.
    -   Search by single or multiple tags (`#work, #project`).
    -   Combine text and tags for complex queries (`meeting notes, #project`).
    -   Use `OR` logic for tags (`OR(#work, #home)`).
-   **Dark/Light Mode:** A beautiful, modern interface with a theme toggle that remembers your preference.
-   **Data Export:** Download all your notes in a clean JSON format at any time.
-   **Easy Deployment:** Runs entirely within a Docker container for a simple, one-command setup.

## Project Goal

The primary goal of FastNote is to provide a fast, reliable, and private note-taking experience. In a world where personal data is often hosted on third-party servers, FastNote offers an alternative by putting the user in complete control of their information. It's built with standard, robust technologies (Python, Flask, SQLite, Docker) to be both easy to use and easy to maintain.

## Getting Started

### Prerequisites

-   [Docker](https://www.docker.com/get-started)
-   [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

### Setup and Installation

Setting up FastNote is designed to be as simple as possible.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/sarthakganguly/fastnote.git
    cd fastnote
    ```

2.  **Make the Entrypoint Script Executable:**
    This one-time command ensures the script that initializes the database can be run by Docker.
    ```bash
    chmod +x entrypoint.sh
    ```

3.  **Build and Run the Application:**
    This single command will build the Docker image and start the application in the background.
    ```bash
    docker-compose up --build -d
    ```

4.  **Access FastNote:**
    Open your web browser and navigate to `http://localhost:6000`.

    If you are running this on a server or another machine on your network, you can access it via its network IP address (e.g., `http://192.168.1.10:6000`).

The application is now running! The first time you access it, you will be prompted to sign up for a new user account.

### Managing the Application

-   **To stop the application:**
    ```bash
    docker-compose down
    ```
-   **To restart the application:**
    ```bash
    docker-compose up -d
    ```

**Important:** Your notes and user data are stored in an `instance` directory that is created in the project folder. This makes your data persistent even when the Docker container is stopped or removed. **Do not delete this folder unless you want to erase all your data.**

## How to Contribute

Contributions are welcome and greatly appreciated! Whether it's a bug report, a new feature, or an improvement to the documentation, your help makes FastNote better.

### Reporting Bugs

If you find a bug, please open an issue on the [GitHub Issues page](https://github.com/sarthakganguly/fastnote/issues). Please include:
-   A clear and descriptive title.
-   A detailed description of the problem and the steps to reproduce it.
-   Any relevant screenshots or error messages from the browser console or Docker logs (`docker-compose logs`).

### Suggesting Enhancements

For new features or enhancements, feel free to open an issue to discuss your idea first. This helps ensure the proposed change aligns with the project's goals.

### Pull Request Process

1.  **Fork the repository** to your own GitHub account.
2.  **Create a new branch** for your feature or bugfix (`git checkout -b feature/AmazingNewFeature`).
3.  **Make your changes** and commit them with clear, descriptive messages.
4.  **Push your branch** to your fork (`git push origin feature/AmazingNewFeature`).
5.  **Open a Pull Request** against the `main` branch of the `sarthakganguly/fastnote` repository.

## Future Development & Potential Changes

FastNote is a great foundation, and there are many ways it can be extended. Here are a few ideas for potential contributions:

-   **Database Migrations:** Implement a database migration tool like `Flask-Migrate` to handle schema changes without needing to delete the database.
-   **Rich Media:** Allow users to upload and embed images or other files directly into their notes.
-   **Note Pinning:** Add the ability to "pin" important notes to the top of the list.
-   **Keyboard Shortcuts:** Implement shortcuts for creating a new note, saving, and toggling edit/view mode.
-   **WYSIWYG Editor:** Add a "What You See Is What You Get" editor that can be toggled with the Markdown editor for a more visual experience.
-   **End-to-End Encryption:** For an extra layer of security, add client-side encryption before data is saved to the local database.

Thank you for your interest in FastNote