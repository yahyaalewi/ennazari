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
# Allow 50MB Uploads (Matches Nginx)
SecRequestBodyLimit 52428800
SecRequestBodyNoFilesLimit 131072
# Fix for File Uploads: Configure a writable tmp directory
SecUploadDir /tmp
SecTmpDir /tmp
SecDataDir /tmp
SecUploadKeepFiles Off
EOL

echo "✅ Created minimal modsecurity.conf"

# Créer main.conf
echo "# ModSecurity Main Configuration" > /etc/nginx/modsec/main.conf
echo "Include /etc/nginx/modsec/modsecurity.conf" >> /etc/nginx/modsec/main.conf

# Recherche plus robuste des fichiers OWASP CRS
CRS_SETUP=$(find / -name crs-setup.conf.example 2>/dev/null | head -n 1)

if [ -n "$CRS_SETUP" ]; then
    echo "✅ Found crs-setup.conf.example at: $CRS_SETUP"
    cp "$CRS_SETUP" /etc/nginx/modsec/crs-setup.conf
    echo "Include /etc/nginx/modsec/crs-setup.conf" >> /etc/nginx/modsec/main.conf
    
    CRS_DIR=$(dirname "$CRS_SETUP")
    if [ -d "$CRS_DIR/rules" ]; then
        echo "Include $CRS_DIR/rules/*.conf" >> /etc/nginx/modsec/main.conf
        echo "✅ OWASP CRS Rules included from $CRS_DIR/rules/"
    else
        RULES_DIR=$(find / -type d -name "rules" -path "*/owasp*/*" 2>/dev/null | head -n 1)
        if [ -n "$RULES_DIR" ]; then
             echo "Include $RULES_DIR/*.conf" >> /etc/nginx/modsec/main.conf
             echo "✅ OWASP CRS Rules included from $RULES_DIR"
        else
             echo "⚠️ WARNING: OWASP rules directory not found. WAF running with basic config only."
        fi
    fi
else
    # FALLBACK: Create a default crs-setup.conf if none exists
    echo "⚠️ crs-setup.conf.example not found. Creating default..."
    cat > /etc/nginx/modsec/crs-setup.conf <<EOL
SecAction \\
 "id:900990,\\
  phase:1,\\
  nolog,\\
  pass,\\
  t:none,\\
  setvar:tx.crs_setup_version=330"
EOL
    echo "Include /etc/nginx/modsec/crs-setup.conf" >> /etc/nginx/modsec/main.conf
    
    # Try to find rules anyway
    RULES_DIR=$(find / -type d -name "rules" -path "*/owasp*/*" 2>/dev/null | head -n 1)
        if [ -n "$RULES_DIR" ]; then
             echo "Include $RULES_DIR/*.conf" >> /etc/nginx/modsec/main.conf
             echo "✅ OWASP CRS Rules included from $RULES_DIR"
        else
             echo "⚠️ WARNING: OWASP rules directory not found. WAF running with basic config only."
        fi
fi
# ------------------------------------------------

echo "🌱 Starting Node.js..."
PORT=$NODE_PORT node server.js &
NODE_PID=$!

echo "⏳ Waiting for Node.js to be ready on port $NODE_PORT..."
# Attendre jusqu'a 45 secondes que le port 3000 réponde
count=0
while ! nc -z 127.0.0.1 $NODE_PORT; do   
  # Vérifier si le processus Node est toujours en vie
  if ! kill -0 $NODE_PID 2>/dev/null; then
      echo "❌ ERROR: Node.js process died unexpectedly! Checking logs above to see why."
      wait $NODE_PID 
      exit 1
  fi

  sleep 1
  count=$((count + 1))
  if [ $count -ge 45 ]; then
      echo "❌ Timeout waiting for Node.js to start. Check logs above."
      exit 1
  fi
  echo "Still waiting for Node.js... ($count/45s)"
done
echo "✅ Node.js is UP and listening!"

echo "🛡️ Configuring Nginx WAF..."
# Remplacer le port
sed -i "s/\${PORT}/$REAL_PORT/g" /etc/nginx/conf.d/default.conf

echo "✅ Starting Nginx..."
nginx -g 'daemon off;'

kill $NODE_PID
