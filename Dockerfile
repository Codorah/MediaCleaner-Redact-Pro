FROM node:20-slim AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Required system packages for OpenCV, FFmpeg, and Python packages
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . .

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend-dist ./frontend-dist

# Create necessary directories
RUN mkdir -p /app/data /app/.models /app/.tmp

# Hugging Face Spaces exposes port 7860
EXPOSE 7860

# Command to run the FastApi server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
