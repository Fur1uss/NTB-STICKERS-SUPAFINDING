import React from "react";
import { useEffect, useState } from "react";
import supabase from "../../config/supabaseClient";
import authService from "../../services/authService";
import './HomeScreen.css';
import { useNavigate } from "react-router-dom";

import UnfoldingBoard from "../UnfoldingBoard/UnfoldingBoard";
import GameInfoComponent from "../GameInfoComponent/GameInfoComponent";

// Variable global para evitar múltiples llamadas concurrentes
let globalProcessing = false;

function HomeScreen() {
    const [user, setUser] = useState(null);
    const [backendUser, setBackendUser] = useState(null);
    const [showBoard, setShowBoard] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    const handleAuthenticatedUser = async (supabaseUser) => {
        // Usar bandera global para evitar múltiples llamadas
        if (globalProcessing || isProcessing) {
            console.log('Ya se está procesando un usuario globalmente, saltando...');
            return;
        }

        try {
            globalProcessing = true;
            setIsProcessing(true);
            setLoading(true);
            setError(null);
            
            console.log('Procesando usuario autenticado...');
            console.log('Google Provider ID:', supabaseUser.user_metadata?.provider_id);
            console.log('Email:', supabaseUser.email);
            
            await authService.checkBackendHealth();
            
            const response = await authService.createOrGetUser();
            
            if (response.success) {
                console.log('Usuario procesado exitosamente:', response.user.username);
                console.log('DB ID:', response.user.id);
                console.log('Google ID en DB:', response.user.googleId);
                setBackendUser(response.user);
                
                localStorage.setItem('backendUser', JSON.stringify(response.user));
                
                // El usuario está configurado, mostrar mensaje final
                console.log('✅ Usuario configurado, botones de juego habilitados');
                
            } else {
                throw new Error('Error en la respuesta del backend');
            }
            
        } catch (error) {
            console.error('Error procesando usuario:', error);
            setError(`Error procesando usuario: ${error.message}`);
        } finally {
            setLoading(false);
            setIsProcessing(false);
            globalProcessing = false; // Liberar bandera global
        }
    };
    
    useEffect(() => {
        // Cargar usuario guardado PRIMERO, antes de hacer cualquier cosa
        const savedUser = localStorage.getItem('backendUser');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                console.log('📱 Cargando usuario guardado:', parsedUser.username);
                setBackendUser(parsedUser);
            } catch (error) {
                console.error('Error cargando usuario guardado:', error);
                localStorage.removeItem('backendUser');
            }
        }

        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const supabaseUser = session?.user || null;
                setUser(supabaseUser);
                
                // Solo procesar si hay usuario, NO hay usuario backend guardado, y no se está procesando
                if (supabaseUser && !savedUser && !globalProcessing && !isProcessing) {
                    console.log('🔄 Nueva sesión detectada, procesando...');
                    await handleAuthenticatedUser(supabaseUser);
                } else if (!supabaseUser) {
                    setBackendUser(null);
                    localStorage.removeItem('backendUser');
                } else if (supabaseUser && savedUser) {
                    console.log('✅ Usuario ya configurado, saltando procesamiento');
                }
            } catch (error) {
                console.error('Error obteniendo sesion:', error);
                setError('Error obteniendo sesion');
            }
        };
        
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('EVENTO FRONTEND:', event);
            
            const supabaseUser = session?.user ?? null;
            setUser(supabaseUser);
            
            // Solo procesar SIGNED_IN si es un login nuevo (sin usuario guardado)
            if (event === 'SIGNED_IN' && supabaseUser && !localStorage.getItem('backendUser') && !globalProcessing && !isProcessing) {
                console.log('USUARIO LOGUEADO - ENVIANDO AL BACKEND');
                await handleAuthenticatedUser(supabaseUser);
            } else if (event === 'SIGNED_OUT') {
                console.log('Usuario deslogueado');
                setBackendUser(null);
                localStorage.removeItem('backendUser');
                setError(null);
                setIsProcessing(false);
                globalProcessing = false; // Reset global flag
            } else if (event === 'SIGNED_IN' && localStorage.getItem('backendUser')) {
                console.log('✅ Login detectado pero usuario ya existe en localStorage');
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []); // Dependencias vacías - solo ejecutar una vez

    // Efecto para mostrar mensaje de bienvenida cuando el usuario está completamente configurado
    useEffect(() => {
        if (user && backendUser && !loading && !isProcessing && !error) {
            console.log('✅ Usuario completamente configurado!');
            console.log('Supabase User:', user.email);
            console.log('Backend User:', backendUser.username);
            console.log('🎮 Botones de juego habilitados');
        }
    }, [user, backendUser, loading, isProcessing, error]);

    const handleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            
            if (error) {
                console.error('Error durante el login:', error.message);
            }
        } catch (error) {
            console.error('Error inesperado:', error);
        }
    };

    return (
        <>
            <UnfoldingBoard open={showBoard} onClose={() => setShowBoard(false)}>
                <GameInfoComponent />
            </UnfoldingBoard>
            <div className="mainScreenContainer">
                <div className="mainScreenLogoContainer">
                    <img src="/logontb.webp" alt="Logo" className="mainScreenLogo" />
                </div>

                <div className="stickersContainer">
                    <img src="/sticker01.webp" alt="" className="sticker sticker01" />
                    <img src="/sticker02.webp" alt="" className="sticker sticker02" />
                    <img src="/sticker03.webp" alt="" className="sticker sticker03" />
                </div>

                <div className="mainScreenButtonsContainer">
                    
                    {backendUser && (
                        <div className="user-info">
                            <div className="user-welcome">
                                {backendUser.avatarUser && (
                                    <img 
                                        src={backendUser.avatarUser} 
                                        alt="Avatar" 
                                        className="user-avatar"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            marginRight: '10px'
                                        }}
                                    />
                                )}
                                <span>Hola, {backendUser.username}!</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message" style={{
                            color: 'red',
                            padding: '10px',
                            margin: '10px 0',
                            border: '1px solid red',
                            borderRadius: '5px',
                            backgroundColor: 'rgba(255,0,0,0.1)'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="mainScreenButtons">
                        {!user ? (
                            <img 
                                src="/loginButton.webp" 
                                alt="" 
                                onClick={handleLogin} 
                                className="btn login-btn"
                                style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                            />
                        ) : (
                            <div className="main-buttons">
                                {loading ? (
                                    <div className="loading-message">
                                        <p>Configurando tu perfil...</p>
                                        <div className="loading-spinner"></div>
                                    </div>
                                ) : backendUser && user ? (
                                    <>
                                        <img src="/playbutton.webp" onClick={() => navigate("/play")} alt="" className="btn" />
                                        <img src="/howtobutton.webp" alt="" className="btn" onClick={() => setShowBoard(true)} />
                                    </>
                                ) : backendUser ? (
                                    <>
                                        <img src="/playbutton.webp" onClick={() => navigate("/play")} alt="" className="btn" />
                                        <img src="/howtobutton.webp" alt="" className="btn" onClick={() => setShowBoard(true)} />
                                    </>
                                ) : (
                                    <div className="error-message">
                                        <p>Error configurando perfil. Intenta recargar la pagina.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="mainScreenFooter">
                        <p>Game created by NTB Team x Supabase</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HomeScreen;
