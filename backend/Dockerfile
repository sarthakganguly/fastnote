# Use an official lightweight Python image.
FROM python:3.9-slim

# Set the working directory in the container to /app
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application's source code from your host to your image filesystem.
COPY . .

# Expose port 5000 to allow communication with the app
EXPOSE 5000

# Command to run the application using Gunicorn.
# The "-k gevent" flag tells Gunicorn to use the efficient, asynchronous gevent workers.
# This prevents the timeout errors we were seeing with the default sync workers.
CMD ["gunicorn", "-w", "4", "-k", "gevent", "-b", "0.0.0.0:5000", "app.main:app"]