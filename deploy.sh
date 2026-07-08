#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BUCKET="app.sabturno.com"
DIST_DIR="./out"
AWS_PROFILE="sabturno"

echo -e "${YELLOW}Deploying client-web/ a S3...${NC}"

# Verificar que out existe
if [ ! -d "$DIST_DIR" ]; then
  echo "No existe $DIST_DIR. Ejecuta npm run build antes de desplegar."
  exit 1
fi

# Verificar que el perfil de AWS existe
if ! aws configure list-profiles | grep -q "^$AWS_PROFILE$"; then
  echo "Error: No se encontró el perfil de AWS '$AWS_PROFILE'."
  echo "Crea el perfil con las credenciales de SabTurno en ~/.aws/credentials"
  exit 1
fi

# Sync a S3 (borra archivos que no están en out)
echo -e "${GREEN}Subiendo archivos a s3://$BUCKET (perfil: $AWS_PROFILE)...${NC}"
aws s3 sync "$DIST_DIR" "s3://$BUCKET" --delete --profile "$AWS_PROFILE"

echo -e "${GREEN}Deploy completo.${NC}"
echo "URL: https://appweb.sabturno.io"
