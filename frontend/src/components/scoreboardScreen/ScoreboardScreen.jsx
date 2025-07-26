import "./scoreboardScreen.css"

const ScoreboardScreen = () => {
    return (
        <div className="scoreboard-screen">
            <div className="scoreboardContainer">
                <div className="titleContainer">
                    <img src="/scoreboardImage.webp" alt="" />
                </div>
                <div className="scoreboardElementContainer"></div>
            </div>
            <div className="informationContainer">
                <div className="stickersContainer">
                    <img src="/sticker05.webp" alt="" className="sticker_scoreboard_02" />
                    <img src="/sticker01.webp" alt="" className="sticker_scoreboard_01" />
                </div>
                <div className="infoUserGameContainer">
                    <p className="infoUserSubtitle">Your score</p>
                    <p></p> {/* Placeholder para puntaje del usuario */}
                    <p>Game time: {/*Aqui va el tiempo de juego*/}</p>
                </div>
                <div className="buttonsContainer">
                    <img src="/uploadButton.webp" alt="Upload your Sticker" className="btn" />
                    <img src="/tryAgainButton.webp" alt="Try Again Button" className="btn"/>
                </div>  
            </div>
        </div>
    );
}

export default ScoreboardScreen;