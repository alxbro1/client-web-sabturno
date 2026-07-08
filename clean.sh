#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Limpiando cache de build de client-web/...${NC}"

# .next es la cache principal de Next.js. Si hay un dev server
# (next dev) corriendo en background con handles abiertos sobre
# .next/server, el build falla con ENOTEMPTY. Limpiarla antes de
# buildear evita ese problema y fuerza un build desde cero.
if [ -d ".next" ]; then
  rm -rf .next
  echo -e "  ${GREEN}OK${NC} .next/ eliminado"
else
  echo "  - .next/ no existía"
fi

# out es la carpeta de archivos estáticos generados por
# next build con output: 'export'. Limpiarla antes de buildear
# evita mezclar archivos de builds anteriores.
if [ -d "out" ]; then
  rm -rf out
  echo -e "  ${GREEN}OK${NC} out/ eliminado"
else
  echo "  - out/ no existía"
fi

# node_modules/.cache lo usan varias deps (Tailwind, PostCSS,
# Next.js turbo). Limpiarlo evita builds con artefactos stale.
if [ -d "node_modules/.cache" ]; then
  rm -rf node_modules/.cache
  echo -e "  ${GREEN}OK${NC} node_modules/.cache/ eliminado"
else
  echo "  - node_modules/.cache/ no existía"
fi

echo -e "${GREEN}Cache limpia.${NC}"
