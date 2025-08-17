# Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x /app/entrypoint.sh

# --- THIS IS THE FIX ---
# Point to the application factory, not the run.py instance
ENV FLASK_APP=app:create_app

ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]