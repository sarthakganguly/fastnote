# Use an official lightweight Python image.
FROM python:3.11-slim

# Set the working directory in the container to /app
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application's source code
COPY . .

# Copy the entrypoint script and ensure it has execution permissions
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port 5000 to allow communication with the app
EXPOSE 5000

# Use the entrypoint script to boot the application
ENTRYPOINT ["/app/entrypoint.sh"]