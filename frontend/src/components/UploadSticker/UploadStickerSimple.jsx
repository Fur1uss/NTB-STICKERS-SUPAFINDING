import React, { useState, useRef } from 'react';
import './UploadStickerSimple.css';

const UploadStickerSimple = ({ userId, onUploadStart, onClose }) => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);

  /**
   * Resetea todos los estados de control
   */
  const resetControlStates = () => {
    setIsSubmitting(false);
  };

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
    
    // Resetear estados de control al cambiar archivo
    resetControlStates();

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
    
    // Prevenir múltiples submits
    if (isSubmitting) {
      return;
    }
    
    if (!file || !name.trim() || !description.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    // Marcar como enviando para prevenir múltiples clicks
    setIsSubmitting(true);
    
    // Iniciar proceso de moderación
    if (onUploadStart) {
      onUploadStart({
        file,
        name: name.trim(),
        description: description.trim(),
        userId
      });
    }
    
    // No resetear isSubmitting aquí, se reseteará cuando se cierre el UnfoldingBoard
  };





  return (
    <div className="upload-sticker-overlay">
      <div className="upload-sticker-container">
        <form className="upload-form" onSubmit={handleSubmit} noValidate>
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
                     disabled={isSubmitting}
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
                     disabled={isSubmitting}
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
                     disabled={isSubmitting}
                     style={{ display: 'none' }}
                  />
                  
                  {/* Imagen clickeable que activa el selector de archivos */}
                                     <div 
                     className={`file-upload-button ${isSubmitting ? 'disabled' : ''}`}
                     onClick={() => !isSubmitting && fileInputRef.current?.click()}
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
                                                 alt={isSubmitting ? 'Subiendo...' : 'Subir Sticker'}
                         onClick={(e) => {
                           e.preventDefault();
                           handleSubmit(e);
                         }}
                         className={`upload-button ${isSubmitting || !file || !name.trim() || !description.trim() ? 'disabled' : ''}`}
                    />
                </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadStickerSimple;
