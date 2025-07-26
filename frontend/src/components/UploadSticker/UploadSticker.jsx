import React, { useState, useRef } from 'react';
import uploadService from '../../services/uploadService.js';
import './UploadSticker.css';

const UploadSticker = ({ userId, onUploadSuccess, onClose }) => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  
  const fileInputRef = useRef(null);

  /**
   * Maneja la selección de archivo
   */
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      setPreview('');
      return;
    }

    // Validar formato PNG
    if (!selectedFile.name.toLowerCase().endsWith('.png')) {
      setError('Solo se permiten archivos PNG');
      setFile(null);
      setPreview('');
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 5MB');
      setFile(null);
      setPreview('');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!file || !name.trim() || !description.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await uploadService.uploadSticker(file, name.trim(), description.trim(), userId);
      
      console.log('✅ Sticker subido exitosamente:', result);
      
      // Limpiar formulario
      setFile(null);
      setName('');
      setDescription('');
      setPreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notificar éxito
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

    } catch (error) {
      console.error('❌ Error subiendo sticker:', error);
      setError(error.message || 'Error al subir el sticker');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el click en el área de drop
   */
  const handleDropClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Maneja el drag and drop
   */
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    
    if (droppedFile) {
      // Simular el evento de cambio de archivo
      const mockEvent = { target: { files: [droppedFile] } };
      handleFileChange(mockEvent);
    }
  };

  return (
    <div className="upload-sticker-overlay">
      <div className="upload-sticker-modal">
        <div className="upload-sticker-header">
          <h2>🎨 Subir tu Sticker</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-sticker-form">
          {/* Área de subida de archivo */}
          <div className="file-upload-area">
            <div 
              className={`drop-zone ${file ? 'has-file' : ''}`}
              onClick={handleDropClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="file-preview">
                  <img src={preview} alt="Preview" className="preview-image" />
                  <p className="file-name">{file.name}</p>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📁</div>
                  <p>Haz click o arrastra tu imagen PNG aquí</p>
                  <p className="upload-hint">Solo archivos PNG, máximo 5MB</p>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".png"
              onChange={handleFileChange}
              className="file-input"
              disabled={loading}
            />
          </div>

          {/* Campos de texto */}
          <div className="form-fields">
            <div className="field-group">
              <label htmlFor="sticker-name">Nombre del Sticker *</label>
              <input
                id="sticker-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mi Sticker Genial"
                maxLength={50}
                disabled={loading}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="sticker-description">Descripción *</label>
              <textarea
                id="sticker-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu sticker..."
                maxLength={200}
                rows={3}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {/* Botones */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="upload-button"
              disabled={loading || !file || !name.trim() || !description.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Subiendo...
                </>
              ) : (
                'Subir Sticker'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadSticker; 