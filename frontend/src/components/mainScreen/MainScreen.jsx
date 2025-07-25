import React from "react";
import { useEffect, useState } from "react";
import supabase from "../../config/supabaseClient";
import './mainScreen.css';

function MainScreen() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

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

    return(
        <div className="mainScreenContainer">
            {!user ? (
                <button className="btn login-btn" onClick={handleLogin}>Iniciar sesión</button>
            ): (<div className="main-buttons">
                <button className="btn play-btn">Play</button>
                <button className="btn howto-btn">How to Play</button>
            </div>)}
        </div>
    );
};

export default MainScreen;