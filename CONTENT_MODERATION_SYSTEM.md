# 🛡️ Sistema de Moderación Automática de Contenido

## 📋 Resumen

Se ha implementado un sistema de moderación automática de imágenes usando **NSFWJS** que detecta y bloquea contenido inapropiado antes de que sea subido al sistema. El análisis se realiza localmente en el frontend, garantizando privacidad y eficiencia.

## 🎯 Objetivos

- ✅ **Detectar contenido inapropiado** (Porn, Sexy, Hentai) con alta precisión
- ✅ **Análisis local** sin enviar imágenes al servidor
- ✅ **Respuesta inmediata** al usuario
- ✅ **Umbral configurable** de detección (70% por defecto)
- ✅ **Precarga del modelo** para mejor experiencia
- ✅ **Manejo de errores robusto** con múltiples fallbacks
- ✅ **Múltiples fuentes de modelo** para mayor confiabilidad

## 🏗️ Arquitectura

### Frontend
- **Servicio**: `moderationService.js` - Lógica de análisis con NSFWJS
- **Componente**: `ModerationCheck.jsx` - UI de moderación
- **Hook**: `useModerationPreload.js` - Precarga del modelo
- **Integración**: `UploadStickerSimple.jsx` - Flujo de upload

### Tecnologías
- **NSFWJS**: Modelo de IA para detección de contenido inapropiado
- **TensorFlow.js**: Motor de inferencia
- **React Hooks**: Gestión de estado y efectos

## 🚀 Instalación

### 1. Instalar dependencias
```bash
cd frontend
npm install nsfwjs
```

### 2. Configuración automática
El sistema se configura automáticamente al iniciar la aplicación. No se requieren variables de entorno adicionales.

## 📁 Estructura de Archivos

```
frontend/src/
├── services/
│   └── moderationService.js      # Servicio principal de moderación
├── components/
│   └── ModerationCheck/
│       ├── ModerationCheck.jsx   # Componente de UI
│       └── ModerationCheck.css   # Estilos
└── hooks/
    └── useModerationPreload.js   # Hook de precarga
```

## 🔧 Funcionalidades

### 1. **Servicio de Moderación** (`moderationService.js`)

#### Carga del Modelo con Múltiples Fallbacks
```javascript
// Intenta cargar desde múltiples CDNs y localmente
await moderationService.loadModel();
```

**Fuentes de modelo (en orden de prioridad):**
1. `https://unpkg.com/nsfwjs@4.2.1/dist/model.json`
2. `https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/model.json`
3. `https://d1zv2aa70wpiur.cloudfront.net/tfjs_models/nsfwjs/1.3.0/model.json`
4. Modelo local del paquete NSFWJS

#### Análisis de Imagen
```javascript
// Analizar archivo File o HTMLImageElement
const result = await moderationService.analyzeImage(file);
```

#### Resultado del Análisis
```javascript
{
  isAppropriate: true/false,
  isInappropriate: true/false,
  dominantCategory: "Drawing", // Categoría principal
  confidence: "85.23", // Porcentaje de confianza
  percentages: {
    Drawing: "85.23",
    Hentai: "8.45",
    Neutral: "4.12",
    Porn: "1.20",
    Sexy: "1.00"
  },
  threshold: 70 // Umbral configurado
}
```

### 2. **Componente de Moderación** (`ModerationCheck.jsx`)

#### Estados Visuales
- **Loading**: Carga del modelo
- **Analyzing**: Análisis de imagen
- **Success**: Imagen apropiada
- **Inappropriate**: Contenido inapropiado
- **Error**: Error en el proceso

#### Características
- ✅ Barra de progreso animada
- ✅ Feedback visual detallado
- ✅ Desglose por categorías
- ✅ Botones de acción contextuales
- ✅ Diseño responsivo
- ✅ Mensajes de error específicos y útiles

### 3. **Hook de Precarga** (`useModerationPreload.js`)

#### Funcionalidades
- ✅ Precarga automática al iniciar la app
- ✅ Estado de carga en tiempo real
- ✅ Manejo de errores
- ✅ Reintentos automáticos

## 🎮 Flujo de Moderación

### 1. **Selección de Archivo**
```
Usuario selecciona imagen PNG
         ↓
Validación de formato y tamaño
         ↓
Preview de imagen
```

### 2. **Proceso de Moderación**
```
Usuario hace clic en "Subir"
         ↓
Inicia moderación automática
         ↓
Carga modelo NSFWJS (con fallbacks)
         ↓
Análisis de imagen
         ↓
Evaluación de resultados
```

### 3. **Resultados**
```
Imagen Apropiada → Continuar con upload
         ↓
Imagen Inapropiada → Bloquear y notificar
         ↓
Error → Permitir continuar sin moderación
```

## ⚙️ Configuración

### Umbral de Detección
```javascript
// En moderationService.js
const threshold = 0.7; // 70% de confianza
```

### Categorías Inapropiadas
```javascript
const inappropriateCategories = ['Porn', 'Sexy', 'Hentai'];
```

### Categorías del Modelo
- **Drawing**: Arte/ilustraciones (generalmente seguro)
- **Hentai**: Contenido anime inapropiado
- **Neutral**: Contenido neutral
- **Porn**: Contenido pornográfico
- **Sexy**: Contenido sugerente

## 📊 Rendimiento

### Tiempos de Respuesta
- **Primera carga**: 3-5 segundos (descarga del modelo)
- **Análisis**: 1-2 segundos por imagen
- **Subsecuentes**: <1 segundo (modelo precargado)

### Optimizaciones
- ✅ Múltiples fuentes de modelo (CDN + local)
- ✅ Precarga en segundo plano
- ✅ Cache del modelo en memoria
- ✅ Análisis asíncrono
- ✅ Fallbacks automáticos

## 🛡️ Seguridad

### Privacidad
- ✅ Análisis local (no se envían imágenes al servidor)
- ✅ Modelo ejecutado en el navegador
- ✅ No almacenamiento de imágenes analizadas

### Precisión
- ✅ Modelo entrenado con millones de imágenes
- ✅ Falsos positivos reducidos con umbral configurable
- ✅ Categorización detallada

## 🔍 Debugging

### Logs del Sistema
```javascript
// Carga del modelo
🔄 Cargando modelo de moderación NSFWJS...
🔄 Intentando cargar modelo desde: https://unpkg.com/nsfwjs@4.2.1/dist/model.json
✅ Modelo de moderación cargado exitosamente

// Análisis
🔍 Analizando imagen para moderación...
📊 Resultados de moderación: [...]
🎯 Categoría dominante: Drawing Confianza: 85.23%

// Resultados
✅ Imagen apropiada, procediendo con upload
🚫 Imagen inapropiada detectada: Porn
```

### Estados de Error
- **Error de carga**: Modelo no disponible desde ninguna fuente
- **Error de análisis**: Imagen corrupta o no soportada
- **Error de red**: Problemas de conectividad

### Manejo de Errores Mejorado
```javascript
// Mensajes específicos según el tipo de error
if (error.message.includes('No se pudo cargar el modelo')) {
  errorMessage = 'No se pudo cargar el sistema de moderación. Continuando sin verificación.';
} else if (error.message.includes('Tipo de imagen no soportado')) {
  errorMessage = 'Formato de imagen no soportado. Por favor, usa PNG, JPG o WebP.';
}
```

## 🎨 Personalización

### Modificar Umbral
```javascript
// En moderationService.js
const threshold = 0.8; // Más estricto (80%)
const threshold = 0.5; // Menos estricto (50%)
```

### Agregar Categorías
```javascript
const inappropriateCategories = ['Porn', 'Sexy', 'Hentai', 'Violence'];
```

### Personalizar UI
```css
/* En ModerationCheck.css */
.moderation-check-container {
  background: linear-gradient(135deg, #tu-color-1, #tu-color-2);
}
```

## 🚨 Casos de Uso

### Caso 1: Imagen Apropiada
1. Usuario selecciona imagen de paisaje
2. Sistema detecta "Neutral" con 90% confianza
3. ✅ Upload permitido

### Caso 2: Imagen Inapropiada
1. Usuario selecciona imagen inapropiada
2. Sistema detecta "Porn" con 85% confianza
3. 🚫 Upload bloqueado con explicación

### Caso 3: Imagen Ambigua
1. Usuario selecciona imagen artística
2. Sistema detecta "Drawing" con 60% confianza
3. ✅ Upload permitido (bajo umbral)

### Caso 4: Error de Sistema
1. Error al cargar modelo desde todos los CDNs
2. Sistema permite continuar sin moderación
3. ⚠️ Log de advertencia y mensaje informativo

### Caso 5: Error de Red
1. Problemas de conectividad
2. Sistema intenta múltiples fuentes
3. Si todo falla, continúa sin moderación

## 📈 Métricas y Analytics

### Datos Recopilados
- Tiempo de carga del modelo
- Tiempo de análisis por imagen
- Categorías detectadas
- Tasa de rechazo
- Errores del sistema
- Fuente de modelo utilizada

### Logs de Auditoría
```javascript
// Ejemplo de log completo
{
  timestamp: "2024-01-15T10:30:00Z",
  action: "image_moderation",
  result: "blocked",
  category: "Porn",
  confidence: 85.23,
  fileSize: 1024000,
  processingTime: 1200,
  modelSource: "unpkg_cdn"
}
```

## 🔮 Mejoras Futuras

### Funcionalidades Planificadas
- [ ] Moderación de texto en descripciones
- [ ] Filtros personalizables por usuario
- [ ] Sistema de apelaciones
- [ ] Moderación en tiempo real
- [ ] Análisis de múltiples formatos

### Optimizaciones Técnicas
- [ ] Modelo más ligero para móviles
- [ ] Cache persistente del modelo
- [ ] Análisis por lotes
- [ ] Compresión de imágenes antes del análisis

## 🛠️ Mantenimiento

### Actualización del Modelo
```bash
# El modelo se actualiza automáticamente desde CDN
# Versión actual: 4.2.1
# Múltiples fuentes garantizan disponibilidad
```

### Monitoreo
- Verificar logs de carga de modelo
- Monitorear tasas de error por fuente
- Revisar tiempos de respuesta
- Analizar patrones de uso

## 🚨 Solución de Problemas

### Problema: Modelo no carga
**Síntomas:**
- Error "No se pudo cargar el modelo de moderación"
- Logs de error de red

**Soluciones:**
1. Verificar conectividad a internet
2. Revisar logs para identificar fuente fallida
3. El sistema automáticamente intenta múltiples fuentes
4. Como último recurso, continúa sin moderación

### Problema: Análisis lento
**Síntomas:**
- Tiempo de análisis > 5 segundos
- Interfaz no responde

**Soluciones:**
1. Verificar rendimiento del dispositivo
2. Comprobar tamaño de imagen
3. Considerar compresión previa

### Problema: Falsos positivos
**Síntomas:**
- Imágenes apropiadas marcadas como inapropiadas
- Usuarios reportan problemas

**Soluciones:**
1. Ajustar umbral de detección
2. Revisar categorías inapropiadas
3. Implementar sistema de apelaciones

## 📞 Soporte

### Logs Útiles para Debugging
```javascript
// Buscar en la consola del navegador:
🔄 Cargando modelo de moderación NSFWJS...
🔄 Intentando cargar modelo desde: [URL]
✅ Modelo de moderación cargado exitosamente
🔍 Analizando imagen para moderación...
📊 Resultados de moderación: [...]
```

### Contacto
Para reportar problemas o solicitar mejoras, revisar los logs del navegador y proporcionar:
- Versión del navegador
- Sistema operativo
- Logs de error completos
- Pasos para reproducir el problema 