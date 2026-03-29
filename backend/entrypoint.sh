#!/bin/bash
set -e

echo "Ensuring database tables are created..."
# Run database initialization synchronously before workers spawn
python -c "from app.main import app; from app.extensions import db; \
app.app_context().push(); \
db.create_all()"

echo "Starting Gunicorn server..."
# The 'exec' command replaces the shell process with Gunicorn, 
# ensuring OS signals (like SIGTERM) are passed directly to Gunicorn.
exec gunicorn --bind 0.0.0.0:5000 -k gevent --preload --workers 4 app.main:app