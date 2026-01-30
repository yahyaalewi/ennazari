#!/bin/sh
# Shell script to start Node.js backend and Nginx WAF

# Default to 10000 if PORT is not set (local testing)
REAL_PORT=${PORT:- "10000"}
NODE_PORT=3000

echo "🚀 Starting Nizar WAF & Backend..."
echo "-----------------------------------"
echo "Target External Port: $REAL_PORT"
echo "Internal Node Port: $NODE_PORT"

# Start Node.js application in background
# We force PORT environment variable to 3000 for the Node app
echo "🌱 Starting Node.js..."
PORT=$NODE_PORT node server.js &
NODE_PID=$!

# Wait a moment for Node to initialize
sleep 2

# Configure Nginx Port
echo "🛡️ Configuring Nginx WAF..."
# Replace ${PORT} in the nginx config with the real port
sed -i "s/\${PORT}/$REAL_PORT/g" /etc/nginx/conf.d/default.conf

# Start Nginx in foreground
echo "✅ Starting Nginx..."
nginx -g 'daemon off;'

# If Nginx dies, kill Node
kill $NODE_PID
