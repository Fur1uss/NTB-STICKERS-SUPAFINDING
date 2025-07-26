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
      const result = await uploadService.uploadSticker(file, userId, name.trim(), description.trim());
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
                        <label htmlFor="name" className="form-label">Nombre del Sticker:</label>
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
                    <label htmlFor="description" className="form-label">Descripción:</label>
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
                <div className="form-group">
                    <label htmlFor="file" className="form-label">Archivo PNG:</label>
                    <input
                    type="file"
                    id="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".png"
                    className="file-input"
                    disabled={loading}
                    />
                </div>

                {preview && (
                    <div className="preview-container">
                    <img 
                        src={preview} 
                        alt="Preview" 
                        className="preview-image"
                    />
                    </div>
                )}

                {error && (
                    <div className="error-message">
                    {error}
                    </div>
                )}

                <div className="button-group">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="btn btn-cancel"
                        >
                        Cancelar
                    </button>
                    
                    <button
                        type="submit"
                        disabled={loading || !file || !name.trim() || !description.trim()}
                        className="btn btn-submit"
                        >
                        {loading ? 'Subiendo...' : 'Subir Sticker'}
                    </button>
                </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadStickerSimple;
