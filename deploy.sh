#!/bin/bash
set -e

GREEN='\033[0;32m'
NC='\033[0m'

SERVER="ubuntu@54.210.182.128"
KEY="/Users/alexandersauro/Desktop/Credentials/PEM/styleup-key.pem"
REMOTE_PATH="/home/ubuntu/app"
REMOTE_TMP_PATH="/home/ubuntu/app_tmp_deploy"
LOCAL_DIST="./dist"

echo -e "${GREEN}Iniciando deploy...${NC}"

if [ ! -d "$LOCAL_DIST" ]; then
	echo "No existe $LOCAL_DIST. Ejecuta npm run build antes de desplegar."
	exit 1
fi

sudo ssh -i "$KEY" "$SERVER" "mkdir -p '$REMOTE_TMP_PATH'"
sudo scp -i "$KEY" -r "$LOCAL_DIST"/. "$SERVER:$REMOTE_TMP_PATH/"

sudo ssh -i "$KEY" "$SERVER" "
	set -e
	sudo mkdir -p '$REMOTE_PATH'

	if command -v rsync >/dev/null 2>&1; then
		sudo rsync -a --delete '$REMOTE_TMP_PATH/' '$REMOTE_PATH/'
	else
		sudo find '$REMOTE_PATH' -mindepth 1 -maxdepth 1 -exec rm -rf {} +
		sudo cp -a '$REMOTE_TMP_PATH'/. '$REMOTE_PATH'/
	fi

	sudo chown -R www-data:www-data '$REMOTE_PATH'
	sudo chmod -R 755 '$REMOTE_PATH'
	rm -rf '$REMOTE_TMP_PATH'
"

echo -e "${GREEN}Deploy finalizado correctamente.${NC}"
