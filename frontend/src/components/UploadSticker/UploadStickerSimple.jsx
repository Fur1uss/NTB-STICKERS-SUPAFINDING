import React, { useState, useRef } from 'react';
import uploadService from '../../services/uploadService.js';
import './UploadStickerSimple.css';

const UploadStickerSimple = ({ userId, onUploadSuccess, onClose }) => {
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
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await uploadService.uploadSticker(file, name.trim(), description.trim(), userId);
      console.log('✅ Upload exitoso:', result);
      onUploadSuccess(result);
    } catch (error) {
      console.error('❌ Error en upload:', error);
      setError(error.message || 'Error subiendo sticker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-sticker-overlay">
      <div className="upload-sticker-container">

        <form className="upload-form" onSubmit={handleSubmit}>
            <div className='name-description-container'>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    <img src="/nameTitle.webp" alt="" />
                  </label>
                    <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    disabled={loading}
                    placeholder="Ingresa el nombre del sticker"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    <img src="/descriptionTitle.webp" alt="" />
                  </label>
                    <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                    disabled={loading}
                    placeholder="Describe tu sticker"
                  />
                </div>
            </div>

            <div className='file-upload-container'>
              <div className='file-upload-title'>
                <img src="/stickerTitle.webp" alt="" />
              </div>
                 <div className="form-group upload-group">
                  {/* Input de archivo oculto */}
                  <input
                    type="file"
                    id="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".png"
                    className="file-input-hidden"
                    disabled={loading}
                    style={{ display: 'none' }}
                  />
                  
                  {/* Imagen clickeable que activa el selector de archivos */}
                  <div 
                    className={`file-upload-button ${loading ? 'disabled' : ''}`}
                    onClick={() => !loading && fileInputRef.current?.click()}
                  >
                    <img 
                      src={preview || "/emptySticker.webp"} 
                      alt={file ? "Preview del sticker" : "Seleccionar archivo"} 
                      className="upload-button-image"
                    />

                  </div>
                </div>

                {error && (
                    <div className="error-message">
                    {error}
                    </div>
                )}

                <div className="button-group">

                    <img src="/cancelButton.webp" alt="Cancelar" onClick={onClose} className="cancel-button" />
                    
                    <img 
                        src="/uploadSimpleButton.webp" 
                        alt={loading ? 'Subiendo...' : 'Subir Sticker'}
                        onClick={handleSubmit}
                        className={`upload-button ${loading || !file || !name.trim() || !description.trim() ? 'disabled' : ''}`}
                    />
                </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadStickerSimple;
