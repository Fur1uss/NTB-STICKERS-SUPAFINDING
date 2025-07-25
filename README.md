# NTB-STICKERS-SUPAFINDING 🎨

NTB Sticker Supafinding is a web game built for the Supabase LW15 Hackathon. Inspired by Pictureka, players search for random stickers on a dynamic mural. After winning, users can upload their own sticker as a prize.

## 📁 Estructura del Proyecto

```
├── frontend/          # Aplicación React con Vite
│   ├── src/          # Código fuente de React
│   ├── public/       # Archivos estáticos
│   └── package.json  # Dependencias del frontend
├── backend/          # API Node.js/Express (En desarrollo)
│   ├── config/       # Configuración de base de datos
│   ├── controllers/  # Lógica de negocio
│   ├── middleware/   # Middlewares personalizados
│   ├── models/       # Modelos de datos
│   ├── routes/       # Rutas de la API
│   └── utils/        # Utilidades
└── package.json      # Gestión del monorepo
```

## 🚀 Instalación y Desarrollo

### Frontend (React + Vite)

```bash
# Instalar dependencias del frontend
npm run install:frontend

# Ejecutar servidor de desarrollo
npm run dev:frontend
```

La aplicación estará disponible en: http://localhost:5173/

### Backend (Próximamente)

```bash
# Instalar dependencias del backend
npm run install:backend

# Ejecutar servidor de desarrollo
npm run dev:backend
```

## 🛠️ Tecnologías

### Frontend
- **React** 19.1.0 con Vite 7.0.6
- **ESLint** para linting
- **CSS3** para estilos

### Backend (Estructura preparada)
- **Node.js** con Express
- **Supabase** para base de datos
- **Autenticación** (Por implementar)
- **API RESTful**

## 🎮 Características del Juego

- 🔍 **Búsqueda de Stickers**: Encuentra stickers ocultos en un mural dinámico
- 🏆 **Sistema de Premios**: Sube tu propio sticker al ganar
- 🎨 **Mural Interactivo**: Interfaz visual atractiva
- 📱 **Responsive**: Funciona en dispositivos móviles y desktop

## 📦 Scripts Disponibles

```bash
npm run dev:frontend      # Iniciar desarrollo frontend
npm run dev:backend       # Iniciar desarrollo backend
npm run build:frontend    # Construir frontend para producción
npm run install:frontend  # Instalar dependencias frontend
npm run install:backend   # Instalar dependencias backend
npm run install:all       # Instalar todas las dependencias
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🏆 Hackathon

Este proyecto fue creado para el **Supabase LW15 Hackathon**.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
