import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import supabase from '../../config/supabaseClient';
import AuthCheck from '../AuthCheck/AuthCheck';

/**
 * Componente para proteger rutas que requieren autenticación
 * Verifica si el usuario está autenticado en Supabase y tiene un usuario backend configurado
 */
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthCheck, setShowAuthCheck] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Verificar sesión de Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error verificando sesión:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Verificar si hay usuario en Supabase
        if (!session?.user) {
          console.log('🚫 No hay sesión activa de Supabase');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Verificar si hay usuario backend en localStorage
        const backendUser = localStorage.getItem('backendUser');
        if (!backendUser) {
          console.log('🚫 No hay usuario backend configurado');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Verificar que el usuario backend sea válido
        try {
          const parsedUser = JSON.parse(backendUser);
          if (!parsedUser.id || !parsedUser.username) {
            console.log('🚫 Usuario backend inválido en localStorage');
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
        } catch (parseError) {
          console.error('❌ Error parseando usuario backend:', parseError);
          localStorage.removeItem('backendUser');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        console.log('✅ Usuario autenticado correctamente');
        setIsAuthenticated(true);
        setIsLoading(false);

      } catch (error) {
        console.error('❌ Error en verificación de autenticación:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuthentication();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Cambio en estado de autenticación:', event);
      
      if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuario deslogueado');
        setIsAuthenticated(false);
        localStorage.removeItem('backendUser');
        setShowAuthCheck(true);
      } else if (event === 'SIGNED_IN') {
        // Re-verificar autenticación completa
        checkAuthentication();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [location.pathname]);

  // Efecto separado para manejar cuando mostrar AuthCheck
  useEffect(() => {
    console.log('🔍 Efecto AuthCheck - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'showAuthCheck:', showAuthCheck);
    if (!isAuthenticated && !isLoading && !showAuthCheck) {
      console.log('🚫 Usuario no autenticado, mostrando verificación...');
      setShowAuthCheck(true);
    }
  }, [isAuthenticated, isLoading, showAuthCheck]);

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Verificando autenticación...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Mostrar el contenido protegido y AuthCheck si es necesario
  console.log('🎭 ProtectedRoute renderizando - isAuthenticated:', isAuthenticated, 'showAuthCheck:', showAuthCheck);
  return (
    <>
      {isAuthenticated && children}
      {showAuthCheck && (
        <AuthCheck
          intendedPath={location.pathname}
          onClose={() => setShowAuthCheck(false)}
          onAuthenticationComplete={(intendedPath) => {
            setShowAuthCheck(false);
            // La redirección se maneja dentro del AuthCheck
          }}
        />
      )}
    </>
  );
};

export default ProtectedRoute; 