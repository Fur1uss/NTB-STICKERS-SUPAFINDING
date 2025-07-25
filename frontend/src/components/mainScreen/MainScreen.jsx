import React from "react";
import { useEffect, useState } from "react";
import supabase from "../../config/supabaseClient";
import './mainScreen.css';
import { useNavigate } from "react-router-dom";

import JustAPlantComponent from "../../justAPlantComponent/JustAPlantComponent";
import UnfoldingBoard from "../UnfoldingBoard/UnfoldingBoard";
import GameInfoComponent from "../GameInfoComponent/GameInfoComponent";

function MainScreen() {
    const [user, setUser] = useState(null);
    const [showBoard, setShowBoard] = useState(false);
    const navigate = useNavigate();
    
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
                <div className="mainScreenButtons">
                    {!user ? (
                        <img src="/loginButton.webp" alt="" onClick={handleLogin} className="btn login-btn" />
                    ): (<div className="main-buttons">
                        <img src="/playbutton.webp" onClick={() => navigate("/play")} alt="" className="btn" />
                        <img src="/howtobutton.webp" alt="" className="btn" onClick={() => setShowBoard(true)} />
                    </div>)}
                </div>
                <div className="mainScreenFooter">
                    <p>Game created by NTB Team x Supabase 💗</p>
                </div>
            </div>
        </div>
        </>
    );
};

export default MainScreen;