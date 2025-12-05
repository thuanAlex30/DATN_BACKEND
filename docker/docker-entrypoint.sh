#!/bin/bash

# Docker entrypoint script for Safety Management Backend
echo "Starting Safety Management Backend..."

# Wait for dependencies to be ready
echo "Waiting for dependencies..."

# Wait for MongoDB
until nc -z mongodb 27017; do
    echo "MongoDB is not ready yet. Waiting..."
    sleep 2
done
echo "MongoDB is ready!"

# Wait for Redis
until nc -z redis 6379; do
    echo "Redis is not ready yet. Waiting..."
    sleep 2
done
echo "Redis is ready!"

# Wait for Kafka
until nc -z kafka 29092; do
    echo "Kafka is not ready yet. Waiting..."
    sleep 2
done
echo "Kafka is ready!"

# Run database migrations if needed
echo "Running database setup..."
npm run db:setup || echo "Database setup completed or skipped"

# Start the application
echo "Starting application..."
exec "$@"
