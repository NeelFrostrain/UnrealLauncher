# Use Node.js as base image for building
FROM node:20-bookworm AS builder

# Install Rust for native components
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install system dependencies for Electron and building
RUN apt-get update && apt-get install -y \
    libarchive-tools \
    zip \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    build-essential \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Optimize by pulling package files first
COPY package.json package-lock.json ./
# Also copy Cargo files for better caching of Rust dependencies
COPY native/Cargo.toml native/Cargo.toml
COPY tracer/Cargo.toml tracer/Cargo.toml

# Install Node.js dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Ensure the build script is executable
RUN chmod +x build-linux.sh

# Build the project for Linux using the provided script
RUN ./build-linux.sh

# Prepare the zip file
RUN node -e " \
    const fs = require('fs'); \
    const { execSync } = require('child_process'); \
    const pkg = JSON.parse(fs.readFileSync('package.json')); \
    const version = pkg.version; \
    const zipName = \`Unreal Launcher \${version}.zip\`; \
    console.log(\`Zipping to \${zipName}...\`); \
    if (!fs.existsSync('dist')) { \
        console.error('Build failed: dist folder not found'); \
        process.exit(1); \
    } \
    execSync(\`zip -r '\${zipName}' dist\`); \
    "
