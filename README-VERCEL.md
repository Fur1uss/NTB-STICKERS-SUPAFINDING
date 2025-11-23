# Migración a Vercel - Guía de Despliegue

Este proyecto ha sido migrado de Railway (backend) + Vercel (frontend) a una solución completamente integrada en Vercel.

## Estructura del Proyecto

```
.
├── api/                    # Funciones serverless de Vercel
│   ├── auth/              # Rutas de autenticación
│   ├── game/              # Rutas del juego
│   ├── scoreboard/        # Rutas del scoreboard
│   └── upload/            # Rutas de upload
├── lib/                   # Código compartido (servicios, utilidades)
│   ├── config/            # Configuración (Supabase)
│   ├── services/          # Servicios de negocio
│   ├── controllers/       # Controladores
│   ├── middleware/        # Middleware de autenticación
│   └── utils/            # Utilidades
├── frontend/              # Aplicación React
└── vercel.json           # Configuración de Vercel
```

## Configuración en Vercel

### 1. Variables de Entorno

#### En Vercel (Dashboard):
Configura las siguientes variables de entorno en el dashboard de Vercel:

- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_ANON_KEY`: Clave anónima de Supabase

#### En Desarrollo Local (Frontend):
Para desarrollo local del frontend, crea un archivo `frontend/.env.local`:

```env
VITE_SUPABASE_URL=tu_supabase_project_url
VITE_ANON_KEY=tu_supabase_anon_key
```

**Nota**: Las variables del frontend deben empezar con `VITE_` porque Vite solo expone variables que tienen este prefijo.

### 2. Despliegue en Vercel

#### Opción A: Desde el Dashboard de Vercel (Recomendado)

1. **Conecta tu repositorio**:
   - Ve a [vercel.com](https://vercel.com) e inicia sesión
   - Haz clic en "Add New Project"
   - Conecta tu repositorio de GitHub/GitLab/Bitbucket
   - Selecciona el repositorio del proyecto

2. **Configura el proyecto**:
   - **Root Directory**: Deja vacío (o pon `.` si te lo pide)
   - **Framework Preset**: Vercel lo detectará automáticamente (Vite)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install && cd frontend && npm install`

3. **Configura las Variables de Entorno**:
   - En la sección "Environment Variables", agrega:
     - `SUPABASE_URL`: Tu URL de Supabase (sin `VITE_` prefix)
     - `SUPABASE_ANON_KEY`: Tu clave anónima de Supabase (sin `VITE_` prefix)
   - **Importante**: Estas variables son para las funciones serverless (API)
   - Para el frontend, también necesitas agregar (con prefijo `VITE_`):
     - `VITE_SUPABASE_URL`: Mismo valor que `SUPABASE_URL`
     - `VITE_ANON_KEY`: Mismo valor que `SUPABASE_ANON_KEY`

4. **Despliega**:
   - Haz clic en "Deploy"
   - Vercel construirá y desplegará tu proyecto automáticamente
   - Una vez completado, tendrás una URL como: `tu-proyecto.vercel.app`

#### Opción B: Desde la Terminal (CLI)

```bash
# 1. Instalar Vercel CLI (si no lo tienes)
npm install -g vercel

# 2. Hacer login
vercel login

# 3. Desplegar
vercel

# 4. Seguir las instrucciones:
# - ¿Quieres configurar el proyecto? → Y
# - ¿Qué directorio contiene tu código? → . (raíz)
# - ¿Quieres sobrescribir la configuración? → N (si ya tienes vercel.json)

# 5. Configurar variables de entorno (si no las configuraste antes)
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_ANON_KEY

# 6. Desplegar a producción
vercel --prod
```

#### Verificación Post-Despliegue

Una vez desplegado, verifica que todo funcione:

1. **Frontend**: Visita `https://tu-proyecto.vercel.app`
2. **Health Check**: Visita `https://tu-proyecto.vercel.app/api/health`
   - Deberías ver: `{"status":"ok","message":"API funcionando correctamente"}`
3. **Autenticación**: Prueba iniciar sesión con Google
4. **API**: Verifica en la consola del navegador que las llamadas a `/api/*` funcionen

### 3. Estructura de Rutas

- **Frontend**: Todas las rutas que no empiezan con `/api` se sirven desde el frontend
- **API**: Todas las rutas que empiezan con `/api` se ejecutan como funciones serverless

## Rutas API Disponibles

### Autenticación
- `POST /api/auth/create-or-get-user` - Crea o obtiene un usuario
- `GET /api/auth/user` - Obtiene información del usuario

### Juego
- `POST /api/game/start` - Inicia una nueva partida
- `POST /api/game/:gameId/add-sticker` - Registra un sticker encontrado
- `POST /api/game/:gameId/end` - Finaliza una partida
- `GET /api/game/:gameId` - Obtiene datos de una partida
- `GET /api/game/scoreboard/ranking` - Obtiene ranking

### Scoreboard
- `GET /api/scoreboard/game/:gameId` - Datos de partida para scoreboard
- `GET /api/scoreboard/ranking` - Ranking global
- `GET /api/scoreboard/stats` - Estadísticas generales

### Upload
- `POST /api/upload/sticker` - Sube un sticker
- `GET /api/upload/user-stickers/:userId` - Obtiene stickers del usuario

### Health
- `GET /api/health` - Health check

## Cambios Realizados

### Frontend
- ✅ Actualizado para usar rutas relativas (`/api` en lugar de `VITE_API_URL`)
- ✅ Eliminada dependencia de `VITE_API_URL` (aún funciona si está configurada)

### Backend
- ✅ Convertido de Express a funciones serverless de Vercel
- ✅ Servicios y utilidades movidos a `lib/` para compartir código
- ✅ Middleware de autenticación adaptado para funciones serverless

## Notas Importantes

1. **Upload de Archivos**: La función de upload actualmente requiere que el archivo se envíe como base64 en el body JSON. Para soporte completo de multipart/form-data, considera agregar `formidable` o `busboy`.

2. **Variables de Entorno**: Asegúrate de configurar todas las variables de entorno en Vercel antes del despliegue.

3. **Rutas Dinámicas**: Las rutas dinámicas en Vercel usan corchetes `[param]` en el nombre del archivo.

## Desarrollo Local

Para desarrollo local, puedes usar:

```bash
# Instalar dependencias
npm install
npm run install:all

# Desarrollo solo del frontend (recomendado para desarrollo rápido)
npm run dev
# Nota: Las funciones serverless no estarán disponibles, pero el frontend funcionará

# Desarrollo completo con funciones serverless locales (requiere Vercel CLI)
# 1. Instalar Vercel CLI globalmente
npm install -g vercel

# 2. Hacer login en Vercel (solo la primera vez)
npm run vercel:login
# O directamente: vercel login

# 3. Ejecutar frontend + funciones serverless localmente
npm run dev:full

# O solo las funciones serverless
npm run dev:vercel
```

**Nota**: El backend de Express (`backend/server.js`) ya no es necesario para producción, pero se mantiene en el repositorio por si necesitas referencia. Las funciones serverless en `api/` reemplazan completamente al backend.

**Importante**: Para usar `vercel dev` localmente, necesitas:
1. Tener una cuenta de Vercel
2. Hacer login con `vercel login`
3. El proyecto debe estar vinculado a un proyecto de Vercel (se hace automáticamente la primera vez)

## Ventajas de la Migración

- ✅ **Latencia reducida**: Todo en el mismo dominio/región
- ✅ **Costo reducido**: Vercel es gratuito para el frontend y tiene generoso free tier para funciones serverless
- ✅ **Despliegue simplificado**: Un solo lugar para desplegar
- ✅ **Mejor integración**: Frontend y backend comparten el mismo dominio

## Troubleshooting

### Error: "Module not found"
- Asegúrate de que todas las dependencias estén en `package.json` de la raíz o en `frontend/package.json`

### Error: "Environment variable not found"
- Verifica que todas las variables de entorno estén configuradas en Vercel

### Error: "Function timeout"
- Las funciones serverless tienen un timeout. Considera optimizar operaciones largas o usar background jobs
