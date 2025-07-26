#!/bin/bash

echo "🎨 Configurando Sistema de Upload de Stickers..."
echo "================================================"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde la raíz del proyecto"
    exit 1
fi

echo "📦 Instalando dependencias del backend..."
cd backend
npm install multer

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error instalando dependencias"
    exit 1
fi

cd ..

echo ""
echo "🔧 Verificando archivos del sistema..."
echo "======================================"

# Verificar archivos del frontend
echo "📁 Verificando archivos del frontend..."
if [ -f "frontend/src/components/UploadSticker/UploadSticker.jsx" ]; then
    echo "✅ UploadSticker.jsx encontrado"
else
    echo "❌ UploadSticker.jsx no encontrado"
fi

if [ -f "frontend/src/components/UploadSticker/UploadSticker.css" ]; then
    echo "✅ UploadSticker.css encontrado"
else
    echo "❌ UploadSticker.css no encontrado"
fi

if [ -f "frontend/src/services/uploadService.js" ]; then
    echo "✅ uploadService.js encontrado"
else
    echo "❌ uploadService.js no encontrado"
fi

# Verificar archivos del backend
echo ""
echo "📁 Verificando archivos del backend..."
if [ -f "backend/routes/uploadRoutes.js" ]; then
    echo "✅ uploadRoutes.js encontrado"
else
    echo "❌ uploadRoutes.js no encontrado"
fi

if [ -f "backend/controllers/uploadController.js" ]; then
    echo "✅ uploadController.js encontrado"
else
    echo "❌ uploadController.js no encontrado"
fi

if [ -f "backend/middleware/auth.js" ]; then
    echo "✅ auth.js encontrado"
else
    echo "❌ auth.js no encontrado"
fi

echo ""
echo "🔑 Configuración de Supabase"
echo "============================"
echo "⚠️  IMPORTANTE: Debes configurar las políticas RLS en Supabase"
echo ""
echo "Ejecuta estas consultas SQL en tu panel de Supabase:"
echo ""
echo "1. Permitir inserciones a usuarios autenticados:"
echo "   CREATE POLICY \"Permitir inserciones a usuarios autenticados\""
echo "   ON stickers"
echo "   FOR INSERT"
echo "   USING (auth.uid() IS NOT NULL);"
echo ""
echo "2. Permitir lectura a todos:"
echo "   CREATE POLICY \"Permitir lectura a todos\""
echo "   ON stickers"
echo "   FOR SELECT"
echo "   USING (true);"
echo ""

echo "🚀 Sistema de Upload configurado correctamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura las políticas RLS en Supabase"
echo "2. Reinicia el servidor backend: npm run dev:backend"
echo "3. Reinicia el frontend: npm run dev:frontend"
echo "4. Prueba el sistema subiendo un sticker PNG"
echo ""
echo "📖 Para más información, consulta UPLOAD_SYSTEM.md" 