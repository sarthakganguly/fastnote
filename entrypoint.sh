#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run the database initialization command
flask init-db

# Then exec the container's main process (what's set as CMD in the Dockerfile).
exec "$@"