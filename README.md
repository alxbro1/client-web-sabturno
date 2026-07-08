# SabTurno Client Web

Frontend web para clientes construido con Next.js 16 (App Router), reutilizando contratos y lógica de la app Expo.

## Comandos

```bash
npm install
npm run dev          # Next.js dev server (Turbopack)
npm run build        # next build (genera .next/)
npm run start        # next start (producción)
npm run typecheck    # tsc --noEmit
npm run test         # vitest (watch)
npm run test:run     # vitest single-run (CI)
npm run lint         # next lint (ESLint)
npm run clean        # ./clean.sh (borra .next/ + node_modules/.cache/)
./deploy.sh          # build + sync a S3 (app.sabturno.com)
```

## Variables de entorno

```bash
NEXT_PUBLIC_API_URL=https://app-api.sabturno.com
```

## Alcance actual

- Login, registro y recuperación de contraseña.
- Home cliente con próximo turno y métricas.
- Reserva completa: local, servicio, fecha, horario, método de pago y estado del pago.
- Mis turnos con cancelación.
- Perfil, edición de datos, pagos y eliminación de cuenta.

## Deploy

- **Stack:** S3 + Amplify. Bucket: `app.sabturno.com`. Domain: `appweb.sabturno.io`.
- **Flujo:** `./deploy.sh` ejecuta `npm run build` + `aws s3 sync .next s3://app.sabturno.com --delete --profile sabturno`.
- **Manual:** No hay CI/CD. Deploy bajo demanda.
- **AWS Profile:** `sabturno` (credenciales en `~/.aws/credentials`).
