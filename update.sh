#!/usr/bin/env bash
set -euo pipefail

echo "========================================="
echo "DdotsRealty Deployment Script"
echo "========================================="

# Navigate to deployment directory
echo "[1/6] Changing to deployment directory..."
cd /opt/ddotsrealty

# Pull latest changes
echo "[2/6] Pulling latest changes from main branch..."
git pull origin main

# Install dependencies
echo "[3/6] Installing dependencies..."
npm ci

# Run database migrations
echo "[4/6] Running database migrations..."
npm run db:migrate

# Build application
echo "[5/6] Building application..."
npm run build

# Restart PM2 processes
echo "[6/6] Restarting PM2 processes..."
pm2 restart ecosystem.config.js --update-env

echo "========================================="
echo "Deployment completed successfully!"
echo "========================================="
echo "Web app: http://127.0.0.1:3060 (via Nginx at https://ddotsrealty.com)"
echo "PM2 processes: ddotsrealty, ddotsrealty-worker"
echo "View logs: pm2 logs ddotsrealty"
echo "========================================="
