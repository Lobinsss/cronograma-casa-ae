# Cronograma de obra — Casa AE

Bitácora interactiva del cronograma de obra (Riego, Suministro, Plantación y
Garantía) con diagrama de Gantt, checklist palomeable y validación de cliente.

## Configurar y desplegar en Vercel

1. **Sube este proyecto a un repo de GitHub** (nuevo repo vacío, luego
   `git init && git add -A && git commit -m "cronograma casa ae" && git remote add origin <tu-repo> && git push -u origin main`).

2. **Importa el repo en Vercel** (New Project → selecciona el repo). Framework
   se detecta automático como Next.js.

3. **Agrega una base de Redis** desde el marketplace de integraciones de
   Vercel: busca **"Upstash Redis"**, créala y conéctala al proyecto. Esto
   agrega automáticamente las variables `KV_REST_API_URL` / `KV_REST_API_TOKEN`
   (o `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) — el código acepta
   ambos formatos, no hay que tocar nada más.

4. **Configura las variables de entorno** en Vercel → Project → Settings →
   Environment Variables (ver `.env.example`):
   - `MACONDO_PASSWORD` — contraseña para el rol Macondo
   - `CLIENTE_PASSWORD` — contraseña para el rol Cliente
   - `SESSION_SECRET` — cualquier cadena larga y aleatoria

5. **Deploy.** Comparte la URL con dos contraseñas distintas: una para tu
   equipo (Macondo) y otra para el cliente.

## Cómo funciona el flujo de validación

- **Macondo** marca "Hecho" en cada tarea (avance físico) y "90% pago" en la
  entrega de obra.
- **Cliente** solo puede "Validar" las 3 tareas marcadas (arbolado, arbustos y
  entrega de obra), y solo *después* de que Macondo la haya marcado como
  hecha (y, en el caso de la entrega, con el pago del 90% confirmado).
- Las visitas de garantía (3, una por mes) solo las marca Macondo.
- Todo se sincroniza cada 6 segundos entre los dispositivos conectados.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # y llena las contraseñas + Redis (opcional en local)
npm run dev
```

Sin credenciales de Redis, la app usa un almacenamiento en memoria solo para
`npm run dev` local (no persiste entre reinicios). En producción (Vercel)
siempre debe estar conectado Upstash Redis.

## Fechas del cronograma

Calculadas en días hábiles (L-V), excluyendo festivos oficiales mexicanos
para las visitas de garantía. Si las fechas reales de obra cambian, edítalas
en `src/lib/schedule.ts`.
