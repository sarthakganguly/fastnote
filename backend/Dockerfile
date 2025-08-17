# Use an official lightweight Python image.
# python:3.9-slim is a good choice for keeping the image size down.
FROM python:3.9-slim

# Set the working directory in the container to /app
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# --no-cache-dir ensures that pip doesn't store the package cache, reducing the image size.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application's source code from your host to your image filesystem.
COPY . .

# Expose port 5000 to allow communication with the app
EXPOSE 5000

# Command to run the application using Gunicorn, a production-ready WSGI server.
# -w 4 specifies 4 worker processes.
# -b 0.0.0.0:5000 makes the server accessible from outside the container.
# app.main:app tells Gunicorn to run the 'app' object from the 'app/main.py' file.
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app.main:app"]