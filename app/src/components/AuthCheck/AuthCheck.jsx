import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../../config/supabaseClient';
import UnfoldingBoard from '../UnfoldingBoard/UnfoldingBoard';
import './AuthCheck.css';

/**
 * Componente central de verificación de autenticación
 * Se muestra dentro del UnfoldingBoard con animación
 */
const AuthCheck = ({ intendedPath: propIntendedPath, onClose, onAuthenticationComplete }) => {
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'authenticated' | 'unauthenticated' | 'error'
  const [error, setError] = useState(null);
  const [intendedPath, setIntendedPath] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  console.log('🎬 AuthCheck montado con props:', { propIntendedPath, onClose: !!onClose, onAuthenticationComplete: !!onAuthenticationComplete });



  useEffect(() => {
    // Establecer la ruta de destino inmediatamente
    const redirectTo = propIntendedPath || location.pathname;
    console.log('📍 Ruta proporcionada:', propIntendedPath, 'Ruta actual:', location.pathname, 'RedirectTo:', redirectTo);
    setIntendedPath(redirectTo);

    const checkAuthentication = async () => {
      try {
        console.log('🔍 Verificando estado de autenticación...');

        // Verificar sesión de Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error verificando sesión:', sessionError);
          setAuthState('error');
          setError('Error de conexión con el servidor');
          return;
        }

        // Verificar si hay usuario en Supabase
        if (!session?.user) {
          console.log('🚫 No hay sesión activa de Supabase - Estableciendo estado unauthenticated');
          setAuthState('unauthenticated');
          return;
        }

        // Verificar si hay usuario backend en localStorage
        const backendUser = localStorage.getItem('backendUser');
        console.log('🔍 Usuario backend en localStorage:', backendUser ? 'Existe' : 'No existe');
        if (!backendUser) {
          console.log('🚫 No hay usuario backend configurado - Estableciendo estado unauthenticated');
          setAuthState('unauthenticated');
          return;
        }

        // Verificar que el usuario backend sea válido
        try {
          const parsedUser = JSON.parse(backendUser);
          if (!parsedUser.id || !parsedUser.username) {
            console.log('🚫 Usuario backend inválido en localStorage');
            localStorage.removeItem('backendUser');
            setAuthState('unauthenticated');
            return;
          }
        } catch (parseError) {
          console.error('❌ Error parseando usuario backend:', parseError);
          localStorage.removeItem('backendUser');
          setAuthState('unauthenticated');
          return;
        }

        console.log('✅ Usuario autenticado correctamente');
        setAuthState('authenticated');

      } catch (error) {
        console.error('❌ Error en verificación de autenticación:', error);
        setAuthState('error');
        setError('Error inesperado durante la verificación');
      }
    };

    // Aplicar delay de 5 segundos antes de verificar autenticación
    console.log('⏰ Iniciando delay de 5 segundos...');
    const delayTimer = setTimeout(() => {
      console.log('⏰ Delay completado, verificando autenticación...');
      checkAuthentication();
    }, 5000); // 5 segundos de delay

    // Cleanup del timer si el componente se desmonta
    return () => {
      clearTimeout(delayTimer);
    };
  }, []); // Solo se ejecuta una vez al montar el componente

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Cambio en estado de autenticación:', event);
      
      if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuario deslogueado');
        setAuthState('unauthenticated');
        localStorage.removeItem('backendUser');
      } else if (event === 'SIGNED_IN') {
        console.log('🔐 Usuario logueado, re-verificando...');
        // Re-verificar autenticación completa
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession?.user) {
          // Esperar un momento para que se procese el usuario backend
          setTimeout(() => {
            const backendUser = localStorage.getItem('backendUser');
            if (backendUser) {
              setAuthState('authenticated');
            } else {
              setAuthState('unauthenticated');
            }
          }, 1000);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Manejar redirección basada en el estado de autenticación
  useEffect(() => {
    console.log('🔄 Estado de autenticación cambiado:', authState, 'IntendedPath:', intendedPath);
    
    if (authState === 'authenticated' && intendedPath) {
      console.log('✅ Usuario autenticado, cerrando verificación...');
      // Cerrar el UnfoldingBoard con animación
      setIsOpen(false);
      // Notificar al componente padre que la autenticación fue exitosa
      if (onAuthenticationComplete) {
        onAuthenticationComplete(intendedPath);
      }
    } else if (authState === 'unauthenticated') {
      console.log('🚫 Usuario no autenticado, cerrando verificación...');
      // Primero cerrar el UnfoldingBoard con animación
      setIsOpen(false);
      // Luego redirigir después de que termine la animación
      setTimeout(() => {
        console.log('🚀 Ejecutando redirección al inicio después de la animación...');
        navigate('/', { replace: true });
      }, 1200); // Tiempo para que termine la animación de cierre
    }
  }, [authState, intendedPath, navigate, onAuthenticationComplete]);

  // Función para manejar el cierre manual
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Renderizar el contenido dentro del UnfoldingBoard
  const renderContent = () => {
    if (authState === 'checking') {
      return (
        <div className="auth-check-content">
          <div className="loading-spinner"></div>
          <h2>Verificando autenticación...</h2>
          <p>Estamos verificando tu sesión</p>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
            Esto puede tomar unos segundos
          </p>
        </div>
      );
    }

    if (authState === 'error') {
      return (
        <div className="auth-check-content error">
          <div className="error-icon">❌</div>
          <h2>Error de Verificación</h2>
          <p>{error || 'Ocurrió un error durante la verificación'}</p>
        </div>
      );
    }

    // Estado transitorio mientras se redirige
    return (
      <div className="auth-check-content">
        <div className="loading-spinner"></div>
        <h2>Redirigiendo...</h2>
        <p>Preparando tu experiencia</p>
      </div>
    );
  };

  return (
    <UnfoldingBoard 
      open={isOpen} 
      onClose={handleClose}
      showCloseButton={false}
    >
      {renderContent()}
    </UnfoldingBoard>
  );
};

export default AuthCheck; 