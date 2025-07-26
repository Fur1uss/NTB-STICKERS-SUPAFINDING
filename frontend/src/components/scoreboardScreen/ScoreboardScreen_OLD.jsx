import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import GameAPIService from '../../services/gameService';
import UnfoldingBoard from '../UnfoldingBoard/UnfoldingBoard';
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';
import "./scoreboardScreen.css"

const ScoreboardScreen = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Estados para los datos del scoreboard
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [globalRanking, setGlobalRanking] = useState([]);
    const [userPosition, setUserPosition] = useState(null);
    
    // Estados para el UnfoldingBoard
    const [showUnfoldingBoard, setShowUnfoldingBoard] = useState(true);
    const [contentLoaded, setContentLoaded] = useState(false);

    // Obtener gameId de la URL o localStorage
    const gameId = searchParams.get('gameId') || 
        JSON.parse(localStorage.getItem('lastGameResult') || '{}').gameId;

    /**
     * Cargar datos del scoreboard
     */
    const loadScoreboardData = async () => {
        if (!gameId) {
            setError('No se encontró ID de partida');
            setLoading(false);
            return;
        }

        console.log('\n🏆 CARGANDO DATOS DEL SCOREBOARD');
        console.log('🎮 Game ID:', gameId);

        try {
            setLoading(true);
            setError(null);

            // Cargar datos de la partida específica
            try {
                const scoreboardData = await GameAPIService.getScoreboardData(gameId);
                setGameData(scoreboardData);
                console.log('✅ Datos de partida específica cargados exitosamente');
            } catch (scoreboardError) {
                console.error('❌ Error cargando datos de partida específica:', scoreboardError);
                
                // Si la partida no se encuentra, usar datos de localStorage como fallback
                if (scoreboardError.message.includes('Partida no encontrada')) {
                    console.log('🔄 Partida no encontrada, usando datos de localStorage...');
                    const lastGameData = localStorage.getItem('lastGameResult');
                    
                    if (lastGameData) {
                        try {
                            const gameData = JSON.parse(lastGameData);
                            setGameData({
                                game: {
                                    id: gameData.gameId,
                                    score: gameData.finalScore || 0,
                                    timePlayed: '00:01:30', // Tiempo por defecto
                                    user: {
                                        username: 'Jugador',
                                        id: 1
                                    }
                                },
                                statistics: {
                                    stickersFound: gameData.stickersFound || 0,
                                    stickersDetails: []
                                }
                            });
                            
                            console.log('✅ Datos cargados desde localStorage');
                        } catch (parseError) {
                            console.error('❌ Error parseando datos de localStorage:', parseError);
                        }
                    }
                } else {
                    console.error('❌ Error diferente al buscar partida:', scoreboardError.message);
                }
            }

            // SIEMPRE cargar ranking global (independientemente del resultado anterior)
            console.log('\n🌟 CARGANDO RANKING GLOBAL...');
            const backendUser = JSON.parse(localStorage.getItem('backendUser') || '{}');
            console.log('👤 Usuario del backend:', backendUser);
            
            const ranking = await GameAPIService.getGlobalRanking({
                limit: 20, // Aumentamos el límite para ver más datos
                page: 1,
                userId: backendUser.id
            });
            
            console.log('🏆 RESPUESTA COMPLETA DEL RANKING:');
            console.log('📊 Datos completos:', ranking);
            console.log('📋 Array de ranking:', ranking.ranking);
            console.log('📈 Cantidad de elementos en ranking:', ranking.ranking?.length || 0);
            console.log('👤 Estadísticas del usuario:', ranking.userStats);
            console.log('📄 Información de paginación:', ranking.pagination);
            
            // Mostrar cada elemento del ranking
            if (ranking.ranking && ranking.ranking.length > 0) {
                console.log('🎯 ELEMENTOS DEL RANKING DETALLADOS:');
                ranking.ranking.forEach((item, index) => {
                    console.log(`   ${index + 1}. Posición: #${item.position}`);
                    console.log(`      👤 Usuario: ${item.user.username} (ID: ${item.user.id})`);
                    console.log(`      🎮 Juego ID: ${item.game.id}`);
                    console.log(`      🏆 Score: ${item.game.score}`);
                    console.log(`      ⏱️ Tiempo: ${item.game.timePlayed}`);
                    console.log(`      📅 Fecha: ${item.game.createDate}`);
                    console.log(`      🌟 Es usuario actual: ${item.isCurrentUser}`);
                    console.log('      ---');
                });
            } else {
                console.log('❌ No hay elementos en el ranking o ranking es undefined');
            }
            
            setGlobalRanking(ranking.ranking || []);
            setUserPosition(ranking.userStats?.globalPosition);

            console.log('✅ Datos del scoreboard cargados exitosamente');
            
            // Marcar contenido como cargado y cerrar UnfoldingBoard después de un breve delay
            setContentLoaded(true);
            setTimeout(() => {
                setShowUnfoldingBoard(false);
            }, 1000); // 1 segundo de delay para mostrar que se completó

        } catch (error) {
            console.error('❌ Error general cargando scoreboard:', error);
            setError(`Error cargando datos: ${error.message}`);
            
            // Cerrar UnfoldingBoard incluso si hay error
            setContentLoaded(true);
            setTimeout(() => {
                setShowUnfoldingBoard(false);
            }, 1000);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Efecto para cargar datos al montar el componente
     */
    useEffect(() => {
        loadScoreboardData();
    }, [gameId]);

    /**
     * Función para formatear tiempo
     */
    const formatTime = (timeString) => {
        if (!timeString) return '00:00:00';
        
        // Si viene como número de segundos
        if (typeof timeString === 'number') {
            const minutes = Math.floor(timeString / 60);
            const seconds = timeString % 60;
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Si ya viene formateado
        return timeString;
    };

    /**
     * Función para cerrar manualmente el UnfoldingBoard
     */
    const handleCloseUnfoldingBoard = () => {
        setShowUnfoldingBoard(false);
    };
    return (
        <>
            {/* UnfoldingBoard de carga */}
            <UnfoldingBoard 
                open={showUnfoldingBoard} 
                onClose={contentLoaded ? handleCloseUnfoldingBoard : null}
            >
                <LoadingAnimation />
                {contentLoaded && (
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '20px', 
                        color: 'white', 
                        fontSize: '1.2rem',
                        fontFamily: "'Fredericka the Great', cursive"
                    }}>
                        ✅ Scoreboard cargado exitosamente
                    </div>
                )}
            </UnfoldingBoard>

            {/* Contenido principal del scoreboard */}
            <div className="scoreboard-screen">
                {loading ? (
                    <div className="loading">Cargando resultados...</div>
                ) : error ? (
                    <div className="error">Error: {error}</div>
                ) : (
                    <>
                        <div className="scoreboardContainer">
                            <div className="titleContainer">
                                <img src="/scoreboardImage.webp" alt="" />
                            </div>
                            <div className="scoreboardElementContainer">
                                <div className="scrollContainer">
                                    {globalRanking.length > 0 ? (
                                        globalRanking.map((item, index) => (
                                            <div key={item.game.id} className="scoreboardItem">
                                                <div className="rankPosition">#{item.position}</div>
                                                <div className="playerInfo">
                                                    <span className="playerName">{item.user.username}</span>
                                                    <span className="playerScore">{item.game.score} pts</span>
                                                </div>
                                                <div className="gameTime">{formatTime(item.game.timePlayed)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="noData">No hay datos de ranking disponibles</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="informationContainer">
                            <div className="stickersContainer">
                                <img src="/sticker05.webp" alt="" className="sticker_scoreboard_02" />
                                <img src="/sticker01.webp" alt="" className="sticker_scoreboard_01" />
                            </div>
                            <div className="infoUserGameContainer">
                                <p className="infoUserSubtitle">Your score</p>
                                <p className='infoUserScore'>{gameData?.game?.score || 0}</p>
                                <p>Game time: {formatTime(gameData?.game?.timePlayed)}</p>
                            </div>
                            <div className="buttonsContainer">
                                <img src="/uploadButton.webp" alt="Upload your Sticker" className="btn" />
                                <img src="/tryAgainButton.webp" alt="Try Again Button" onClick={() => navigate("/")} className="btn"/>
                            </div>  
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default ScoreboardScreen;