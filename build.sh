#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build the React frontend
echo "Building frontend..."
npm install
npm run build

# Install Python dependencies
echo "Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt
