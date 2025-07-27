# 🏗️ Estructura del Proyecto NTB-STICKERS-SUPAFINDING

## 📊 Resumen General
**NTB Stickers SupaFinding** es una aplicación web de juego competitivo donde los jugadores buscan, coleccionan y compiten con stickers digitales. Está construida como una aplicación full-stack con React + Vite en el frontend y Node.js + Express en el backend, utilizando Supabase como base de datos y autenticación.

---

## 🎯 Arquitectura del Sistema

### **Frontend (React + Vite)**
- **Framework**: React 18 con Vite como bundler
- **UI**: Componentes modulares con CSS personalizado
- **Estado**: React Hooks y Context API
- **Autenticación**: Supabase Auth
- **Enrutamiento**: React Router DOM v7
- **Deploy**: Vercel

### **Backend (Node.js + Express)**
- **Runtime**: Node.js con módulos ES6
- **Framework**: Express.js
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Middleware personalizado + Supabase
- **Deploy**: Railway
- **APIs**: RESTful endpoints

---

## 📁 Estructura de Directorios

```
NTB-STICKERS-SUPAFINDING/
├── 📁 frontend/                     # Aplicación React + Vite
│   ├── 📁 public/                   # Assets estáticos
│   │   ├── 🖼️ *.webp               # Imágenes del juego (botones, fondos, stickers)
│   │   ├── 📁 cursor/               # Cursores personalizados (.cur)
│   │   └── 📁 sounds/               # Audio del juego
│   │       ├── 📁 music/            # Música de fondo
│   │       └── 📁 sound_effects/    # Efectos de sonido
│   ├── 📁 src/                      # Código fuente React
│   │   ├── 📄 main.jsx              # Punto de entrada de la app
│   │   ├── 🎨 index.css             # Estilos globales
│   │   ├── 📁 components/           # Componentes React
│   │   │   ├── 🔐 AuthCheck/        # Verificación de autenticación
│   │   │   ├── 🎮 PlayScreen/       # Pantalla principal del juego
│   │   │   ├── 🏠 homeScreen/       # Pantalla de inicio
│   │   │   ├── 🏆 scoreboardScreen/ # Tabla de puntuaciones
│   │   │   ├── 📱 OrientationGuard/ # Control de orientación móvil
│   │   │   ├── 🔊 SoundControl/     # Control de audio
│   │   │   ├── 📋 BoardComponent/   # Tablero de juego
│   │   │   ├── 🎯 TargetDisplay/    # Display de objetivos
│   │   │   ├── 🔀 ShuffleButton/    # Botón de mezclar
│   │   │   ├── ⏱️ GameTimer/        # Temporizador del juego
│   │   │   ├── 📊 GameInfoComponent/# Información del juego
│   │   │   ├── ✅ SuccessFeedback/  # Feedback de éxito
│   │   │   ├── 📤 UploadSticker/    # Subida de stickers
│   │   │   ├── 🛡️ ModerationCheck/  # Moderación de contenido
│   │   │   ├── ⏳ LoadingAnimation/ # Animaciones de carga
│   │   │   ├── 🌸 backgroundComponent/ # Componente de fondo
│   │   │   ├── 🎲 PlayWrapper/      # Wrapper del juego
│   │   │   ├── 🔒 ProtectedRoute/   # Rutas protegidas
│   │   │   └── 📜 UnfoldingBoard/   # Animación de despliegue
│   │   ├── 📁 hooks/                # Hooks personalizados
│   │   │   ├── ⏰ useUploadLimit.js # Hook para límites de upload
│   │   │   └── 🎮 useGameLogic.js   # Lógica del juego
│   │   ├── 📁 services/             # Servicios y APIs
│   │   │   ├── 📤 uploadService.js  # Servicio de subida
│   │   │   ├── ⏰ uploadLimitService.js # Control de límites
│   │   │   ├── 🎮 gameService.js    # Lógica del juego
│   │   │   └── 🏆 scoreboardService.js # Puntuaciones
│   │   ├── 📁 config/               # Configuraciones
│   │   │   └── 🗄️ supabaseClient.js # Cliente Supabase
│   │   ├── 📁 utils/                # Utilidades
│   │   │   └── 🎮 gameUtils.js      # Utilidades del juego
│   │   ├── 📁 assets/               # Assets del código
│   │   │   └── 🖼️ sticker01.png    # Stickers de ejemplo
│   │   └── 📁 justAPlantComponent/  # Componente decorativo
│   ├── 📄 package.json              # Dependencias frontend
│   ├── ⚙️ vite.config.js           # Configuración Vite
│   ├── 🚀 vercel.json              # Configuración deploy Vercel
│   └── 📏 eslint.config.js         # Configuración ESLint
│
├── 📁 backend/                      # API Node.js + Express
│   ├── 📄 server.js                 # Servidor principal
│   ├── 🔍 auth-monitor.js           # Monitor de autenticación
│   ├── 🧪 test-env.js               # Tests de entorno
│   ├── 📁 config/                   # Configuraciones backend
│   │   └── 🗄️ supabaseClient.js    # Cliente Supabase backend
│   ├── 📁 controllers/              # Controladores MVC
│   │   ├── 🎮 gameController.js     # Lógica del juego
│   │   ├── 🏆 scoreboardController.js # Control de puntuaciones
│   │   ├── 🏷️ stickerController.js # Control de stickers
│   │   └── 📤 uploadController.js   # Control de uploads
│   ├── 📁 middleware/               # Middleware personalizado
│   │   └── 🔐 auth.js               # Autenticación y autorización
│   ├── 📁 models/                   # Modelos de datos
│   │   └── 🏷️ Sticker.js           # Modelo de sticker
│   ├── 📁 routes/                   # Rutas de la API
│   │   ├── 🎮 gameRoutes.js         # Rutas del juego
│   │   ├── 🏆 scoreboardRoutes.js   # Rutas de puntuaciones
│   │   └── 📤 uploadRoutes.js       # Rutas de upload
│   ├── 📁 services/                 # Servicios backend
│   │   ├── 🎮 gameService.js        # Servicio del juego
│   │   ├── 📊 scoreCalculator.js    # Calculadora de puntos
│   │   └── 🏷️ stickerService.js    # Servicio de stickers
│   ├── 📁 utils/                    # Utilidades backend
│   │   └── 🎮 gameValidation.js     # Validaciones del juego
│   └── 📄 package.json              # Dependencias backend
│
├── 📄 package.json                  # Configuración monorepo
├── 📖 README.md                     # Documentación principal
├── 🛡️ setup-upload-system.sh       # Script de configuración
│
└── 📁 docs/                         # Documentación técnica
    ├── 📋 UPLOAD_SYSTEM.md          # Sistema de uploads
    ├── 🛡️ CONTENT_MODERATION_SYSTEM.md # Sistema de moderación
    ├── 🔒 ROUTE_PROTECTION_IMPLEMENTATION.md # Protección de rutas
    ├── 🏷️ STICKER_IDENTIFICATION_SYSTEM.md # Identificación de stickers
    ├── 🔁 STICKER_REPETITION_CHANGES.md # Control de repeticiones
    ├── 🖱️ CLICK_PROTECTION_SOLUTION.md # Protección de clicks
    ├── 🔄 DUPLICATE_UPLOAD_FIX.md    # Fix de uploads duplicados
    └── 🏆 UNFOLDINGBOARD_SCOREBOARD_INTEGRATION.md # Integración scoreboard
```

---

## 🔧 Tecnologías y Dependencias

### **Frontend**
```json
{
  "react": "^18.3.1",              // Framework principal
  "react-router-dom": "^7.7.1",   // Enrutamiento SPA
  "vite": "^6.0.5",               // Build tool y dev server
  "@supabase/supabase-js": "^2.52.1", // Cliente Supabase
  "eslint": "^9.17.0"             // Linter de código
}
```

### **Backend**
```json
{
  "express": "^4.18.2",           // Framework web
  "@supabase/supabase-js": "^2.52.1", // Cliente Supabase
  "cors": "^2.8.5",               // Control de CORS
  "helmet": "^7.1.0",             // Seguridad HTTP
  "express-rate-limit": "^7.1.5", // Rate limiting
  "multer": "^1.4.5-lts.1",       // Upload de archivos
  "jsonwebtoken": "^9.0.2",       // JWT tokens
  "bcryptjs": "^2.4.3",           // Hashing de passwords
  "mongoose": "^8.0.0",           // ODM para MongoDB (opcional)
  "dotenv": "^16.6.1"             // Variables de entorno
}
```

---

## 🗄️ Base de Datos (Supabase)

### **Tablas Principales**
```sql
-- Tabla de stickers subidos por usuarios
stickers (
  id: uuid PRIMARY KEY,
  iduser: uuid REFERENCES auth.users(id),
  namesticker: text,
  urlsticker: text,
  descriptionsticker: text,
  created_at: timestamp DEFAULT now()
)

-- Tabla de puntuaciones del juego
scores (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES auth.users(id),
  score: integer,
  game_time: integer,
  stickers_found: integer,
  created_at: timestamp DEFAULT now()
)

-- Profiles de usuarios (extensión de auth.users)
profiles (
  id: uuid PRIMARY KEY REFERENCES auth.users(id),
  username: text,
  avatar_url: text,
  created_at: timestamp DEFAULT now()
)
```

---

## 🎮 Funcionalidades Principales

### **Sistema de Juego**
- 🎯 **Objetivo**: Encontrar stickers específicos en el tablero
- ⏱️ **Temporizador**: Límite de tiempo por partida
- 🔀 **Mezcla**: Reorganización aleatoria del tablero
- 🏆 **Puntuación**: Sistema de puntos basado en tiempo y precisión

### **Sistema de Upload**
- 📤 **Subida de Stickers**: Los usuarios pueden subir sus propios stickers
- ⏰ **Límites de Tiempo**: 1 sticker por hora por usuario
- 🛡️ **Moderación**: Verificación de contenido antes de publicar
- 🏷️ **Identificación**: Sistema de reconocimiento de stickers únicos

### **Sistema de Autenticación**
- 🔐 **Login/Registro**: Supabase Auth
- 🛡️ **Rutas Protegidas**: Middleware de autenticación
- 👤 **Perfiles**: Gestión de usuarios y avatares

### **Sistema de Puntuaciones**
- 🏆 **Leaderboard**: Tabla de mejores puntuaciones
- 📊 **Estadísticas**: Tracking de progreso del jugador
- 🏅 **Ranking**: Sistema de clasificación competitivo

---

## 🚀 Despliegue

### **Frontend (Vercel)**
```bash
# Build automático desde GitHub
npm run build:frontend
# Deploy en: https://your-app.vercel.app
```

### **Backend (Railway)**
```bash
# Deploy automático desde GitHub
npm start
# API en: https://your-api.railway.app
```

### **Base de Datos (Supabase)**
- **Dashboard**: https://supabase.com/dashboard
- **API URL**: Configurada en variables de entorno
- **Auth**: Integrada con frontend y backend

---

## 🔄 Flujo de Desarrollo

### **Monorepo Structure**
```bash
# Instalar todas las dependencias
npm run install:all

# Desarrollo concurrente (frontend + backend)
npm run dev

# Solo frontend
npm run dev:frontend

# Solo backend  
npm run dev:backend
```

### **Estructura de Branches**
- `main`: Rama principal (producción)
- `frontend`: Desarrollo frontend
- `backend`: Desarrollo backend
- `feature/*`: Features específicas

---

## 📋 Scripts Disponibles

### **Root Package.json**
```bash
npm run dev          # Inicia frontend + backend
npm run dev:frontend # Solo React + Vite
npm run dev:backend  # Solo Node.js + Express
npm run build:frontend # Build para producción
npm run install:all  # Instala todas las deps
```

### **Frontend Scripts**
```bash
npm run dev          # Vite dev server
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # ESLint check
```

### **Backend Scripts**
```bash
npm start            # Servidor de producción
npm run dev          # Nodemon development
npm run auth-monitor # Monitor de autenticación
npm test             # Tests (por implementar)
```

---

## 🔧 Configuración de Entorno

### **Variables de Entorno**
```bash
# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
NODE_ENV=development
```

---

## 🎯 Características Destacadas

### **Optimizaciones de Performance**
- ⚡ **Vite**: Build tool ultra-rápido
- 🔄 **Lazy Loading**: Componentes cargados bajo demanda
- 📱 **Responsive**: Diseño adaptativo móvil/desktop
- 🎨 **CSS Optimizado**: Estilos modulares y eficientes

### **Experiencia de Usuario**
- 🎵 **Audio**: Música y efectos de sonido
- 🖱️ **Cursores Personalizados**: Interfaz única
- 📱 **Orientación Móvil**: Control automático de rotación
- ⏳ **Loading States**: Feedback visual constante

### **Seguridad**
- 🛡️ **Helmet**: Headers de seguridad HTTP
- 🚫 **Rate Limiting**: Protección contra spam
- 🔐 **JWT**: Tokens seguros de autenticación
- 🛡️ **CORS**: Control de orígenes cruzados

### **Escalabilidad**
- 📦 **Modular**: Arquitectura de componentes
- 🔌 **API RESTful**: Endpoints bien estructurados
- 🗄️ **Supabase**: Base de datos escalable
- 🚀 **Deploy Automático**: CI/CD integrado

---

*Este proyecto fue desarrollado para el **Supabase Launch Week 15 Hackathon**, demostrando las capacidades de Supabase en aplicaciones de gaming competitivo en tiempo real.*
