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
# --- CONFIGURATION AUTOMATIQUE DE MODSECURITY ---
echo "🔍 Checking for ModSecurity module..."
# 1. Trouver le module .so
MODSEC_MOD_PATH=$(find / -name "ngx_http_modsecurity_module.so" 2>/dev/null | head -n 1)

if [ -n "$MODSEC_MOD_PATH" ]; then
    echo "✅ Found ModSecurity module at: $MODSEC_MOD_PATH"
    # 2. L'injecter dans nginx.conf s'il n'y est pas
    if ! grep -q "load_module.*ngx_http_modsecurity_module.so" /etc/nginx/nginx.conf; then
        echo "⚙️ Injecting load_module directive into nginx.conf..."
        sed -i "1i load_module $MODSEC_MOD_PATH;" /etc/nginx/nginx.conf
    fi
else
    echo "⚠️ CRITICAL: ModSecurity module not found. Nginx might fail."
fi

# 3. Générer la configuration des règles (main.conf) si elle manque
# Car on contourne l'entrypoint original qui fait ça normalement
if [ ! -f /etc/nginx/modsec/main.conf ]; then
    echo "🛠️ Generating ModSecurity config..."
    mkdir -p /etc/nginx/modsec
    
    # Copier la conf de base
    [ -f /etc/nginx/modsec/modsecurity.conf-recommended ] && \
        cp /etc/nginx/modsec/modsecurity.conf-recommended /etc/nginx/modsec/modsecurity.conf
    
    # Créer main.conf avec les inclusions
    echo "# ModSecurity Main Configuration" > /etc/nginx/modsec/main.conf
    echo "Include /etc/nginx/modsec/modsecurity.conf" >> /etc/nginx/modsec/main.conf
    
    # Activer les règles OWASP CRS (Core Rule Set)
    # Copier le setup par défaut si besoin
    if [ -f /opt/owasp-crs/crs-setup.conf.example ] && [ ! -f /opt/owasp-crs/crs-setup.conf ]; then
        cp /opt/owasp-crs/crs-setup.conf.example /opt/owasp-crs/crs-setup.conf
    fi
    
    if [ -f /opt/owasp-crs/crs-setup.conf ]; then
        echo "Include /opt/owasp-crs/crs-setup.conf" >> /etc/nginx/modsec/main.conf
        echo "Include /opt/owasp-crs/rules/*.conf" >> /etc/nginx/modsec/main.conf
        echo "✅ OWASP CRS Rules included."
    else
        echo "⚠️ OWASP CRS files not found in /opt/owasp-crs/"
    fi
fi
# ------------------------------------------------

echo "🌱 Starting Node.js..."
PORT=$NODE_PORT node server.js &
NODE_PID=$!

sleep 3

echo "🛡️ Configuring Nginx WAF..."
# Remplacer le port
sed -i "s/\${PORT}/$REAL_PORT/g" /etc/nginx/conf.d/default.conf

echo "✅ Starting Nginx..."
nginx -g 'daemon off;'

kill $NODE_PID
