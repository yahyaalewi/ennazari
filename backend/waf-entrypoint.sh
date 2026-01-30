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

# 3. Générer la configuration des règles (main.conf) de manière ROBUSTE
echo "🛠️ Generating ModSecurity config..."
mkdir -p /etc/nginx/modsec

# Au lieu de chercher un fichier template qui peut manquer, on crée une conf minimale valide
cat > /etc/nginx/modsec/modsecurity.conf <<EOL
# Configuration ModSecurity Minimale
SecRuleEngine On
SecRequestBodyAccess On
SecResponseBodyAccess Off
SecStatusEngine On
SecAuditLog /dev/stdout
SecAuditLogFormat JSON
EOL

echo "✅ Created minimal modsecurity.conf"

# Créer main.conf
echo "# ModSecurity Main Configuration" > /etc/nginx/modsec/main.conf
echo "Include /etc/nginx/modsec/modsecurity.conf" >> /etc/nginx/modsec/main.conf

# Activer les règles OWASP CRS (Core Rule Set) si disponibles
if [ -f /opt/owasp-crs/crs-setup.conf.example ]; then
    cp /opt/owasp-crs/crs-setup.conf.example /etc/nginx/modsec/crs-setup.conf
    echo "Include /etc/nginx/modsec/crs-setup.conf" >> /etc/nginx/modsec/main.conf
    
    # Chercher où sont vraiment les règles
    if [ -d /opt/owasp-crs/rules ]; then
        echo "Include /opt/owasp-crs/rules/*.conf" >> /etc/nginx/modsec/main.conf
        echo "✅ OWASP CRS Rules included from /opt/owasp-crs/rules/"
    elif [ -d /usr/local/owasp-modsecurity-crs/rules ]; then
         echo "Include /usr/local/owasp-modsecurity-crs/rules/*.conf" >> /etc/nginx/modsec/main.conf
         echo "✅ OWASP CRS Rules included from /usr/local/owasp-modsecurity-crs/"
    else
        echo "⚠️ WARNING: OWASP rules directory not found. WAF running with basic config only."
    fi
else
    echo "⚠️ WARNING: crs-setup.conf.example not found. WAF running with minimal config."
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
