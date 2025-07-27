# 🎨 Sistema de Upload de Stickers

## 📋 Resumen

El sistema de upload de stickers permite a los usuarios subir sus propios stickers PNG al juego después de completar una partida. Los stickers se almacenan en Supabase Storage y se registran en la base de datos para ser utilizados en futuras partidas.

## 🏗️ Arquitectura

### Frontend
- **Componente**: `UploadSticker.jsx` - Modal para subir stickers
- **Servicio**: `uploadService.js` - Manejo de API calls
- **Validaciones**: Solo archivos PNG, máximo 5MB

### Backend
- **Rutas**: `uploadRoutes.js` - Endpoints de la API
- **Controlador**: `uploadController.js` - Lógica de subida
- **Middleware**: `auth.js` - Autenticación con Supabase
- **Validaciones**: Multer para archivos, autenticación requerida

## 🚀 Instalación

### 1. Instalar dependencias del backend
```bash
cd backend
npm install multer
```

### 2. Configurar variables de entorno
Asegúrate de que las siguientes variables estén configuradas en tu `.env`:

```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
```

### 3. Configurar políticas RLS en Supabase
Para que el sistema funcione, necesitas configurar las políticas de Row Level Security en tu tabla `stickers`:

```sql
-- Permitir inserción a usuarios autenticados
CREATE POLICY "Permitir inserciones a usuarios autenticados"
ON stickers
FOR INSERT
USING (auth.uid() IS NOT NULL);

-- Permitir lectura a todos
CREATE POLICY "Permitir lectura a todos"
ON stickers
FOR SELECT
USING (true);
```

## 📁 Estructura de Archivos

```
frontend/src/
├── components/
│   └── UploadSticker/
│       ├── UploadSticker.jsx      # Componente principal
│       └── UploadSticker.css      # Estilos del modal
├── services/
│   └── uploadService.js           # Servicio de API

backend/
├── routes/
│   └── uploadRoutes.js            # Rutas de la API
├── controllers/
│   └── uploadController.js        # Lógica de subida
├── middleware/
│   └── auth.js                    # Autenticación
└── server.js                      # Registro de rutas
```

## 🔧 Uso del Componente

### Básico
```jsx
import UploadSticker from '../components/UploadSticker/UploadSticker';

const MyComponent = () => {
  const [showUpload, setShowUpload] = useState(false);
  const userId = 123; // ID del usuario autenticado

  const handleUploadSuccess = (result) => {
    console.log('Sticker subido:', result);
    setShowUpload(false);
  };

  return (
    <div>
      <button onClick={() => setShowUpload(true)}>
        Subir Sticker
      </button>

      {showUpload && (
        <UploadSticker
          userId={userId}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
};
```

### Props del Componente
- `userId` (number, requerido): ID del usuario que sube el sticker
- `onUploadSuccess` (function, opcional): Callback cuando la subida es exitosa
- `onClose` (function, requerido): Callback para cerrar el modal

## 🔌 API Endpoints

### POST /api/upload/sticker
Sube un sticker al bucket y guarda la metadata.

**Headers requeridos:**
```
Authorization: Bearer <supabase_token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `file`: Archivo PNG (máximo 5MB)
- `name`: Nombre del sticker (string)
- `description`: Descripción del sticker (string)
- `userId`: ID del usuario (number)

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Sticker subido exitosamente",
  "data": {
    "id": 123,
    "iduser": 456,
    "namesticker": "Mi Sticker",
    "urlsticker": "https://...",
    "descriptionsticker": "Descripción del sticker"
  }
}
```

### GET /api/upload/user-stickers/:userId
Obtiene los stickers de un usuario específico.

**Headers requeridos:**
```
Authorization: Bearer <supabase_token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Stickers obtenidos exitosamente",
  "data": [
    {
      "id": 123,
      "namesticker": "Mi Sticker",
      "urlsticker": "https://...",
      "descriptionsticker": "Descripción"
    }
  ]
}
```

## 🛡️ Validaciones

### Frontend
- ✅ Solo archivos PNG
- ✅ Máximo 5MB
- ✅ Campos requeridos (nombre, descripción)
- ✅ Preview del archivo antes de subir

### Backend
- ✅ Autenticación requerida
- ✅ Validación de tipo MIME
- ✅ Límite de tamaño de archivo
- ✅ Verificación de permisos de usuario
- ✅ Content-Type correcto para imágenes

## 🎨 Características del Componente

### UI/UX
- **Modal responsivo** con backdrop blur
- **Drag & Drop** para subir archivos
- **Preview** del archivo seleccionado
- **Validación en tiempo real** con mensajes de error
- **Loading states** con spinner
- **Animaciones suaves** y transiciones

### Funcionalidades
- **Selección múltiple** de archivos (click o drag)
- **Validación de formato** PNG
- **Límite de tamaño** configurable
- **Manejo de errores** robusto
- **Feedback visual** para el usuario

## 🔍 Debugging

### Logs del Frontend
```javascript
// En la consola del navegador
📤 Iniciando subida de sticker...
📁 Archivo: mi-sticker.png
📝 Nombre: Mi Sticker Genial
📄 Descripción: Un sticker muy cool
👤 Usuario ID: 123
✅ Sticker subido exitosamente: { ... }
```

### Logs del Backend
```javascript
// En la consola del servidor
📤 === SUBIDA DE STICKER DESDE FRONTEND ===
👤 Usuario autenticado: { id: 123, email: 'user@example.com' }
📁 Archivo recibido: mi-sticker.png
📝 Datos del formulario: { name: 'Mi Sticker', description: '...', userId: 123 }
✅ Sticker subido exitosamente: { ... }
```

## 🚨 Solución de Problemas

### Error: "new row violates row-level security policy"
**Causa**: Las políticas RLS de Supabase no están configuradas correctamente.
**Solución**: Configurar las políticas SQL mencionadas arriba.

### Error: "Solo se permiten archivos PNG"
**Causa**: El archivo no es PNG o tiene extensión incorrecta.
**Solución**: Asegurarse de que el archivo sea PNG válido.

### Error: "Token inválido o expirado"
**Causa**: El token de autenticación no es válido.
**Solución**: Verificar que el usuario esté autenticado correctamente.

### Error: "El archivo es demasiado grande"
**Causa**: El archivo excede el límite de 5MB.
**Solución**: Comprimir o redimensionar la imagen.

## 🔄 Flujo de Datos

1. **Usuario selecciona archivo** → Validación frontend
2. **Usuario completa formulario** → Validación de campos
3. **Frontend envía FormData** → API call con token
4. **Backend valida token** → Middleware de autenticación
5. **Backend procesa archivo** → Multer + validaciones
6. **Backend sube a Supabase** → Storage + Database
7. **Backend responde** → Datos del sticker creado
8. **Frontend muestra éxito** → Callback + cierre modal

## 📈 Mejoras Futuras

- [ ] Soporte para múltiples formatos (JPG, WebP)
- [ ] Compresión automática de imágenes
- [ ] Categorización de stickers
- [ ] Moderación de contenido
- [ ] Sistema de likes/favoritos
- [ ] Galería personal de stickers
- [ ] Compartir stickers entre usuarios 