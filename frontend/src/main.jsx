import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

//Components
import BackgroundComponent from './components/backgroundComponent/BackgroundComponent.jsx'
import BoardComponent from './components/BoardComponent/BoardComponent.jsx';
import JustAPlantComponent from './justAPlantComponent/JustAPlantComponent.jsx'

//Screens
import MainScreen from './components/mainScreen/MainScreen.jsx';
import PlayScreen from "./components/PlayScreen/PlayScreen.jsx";
import ScoreboardScreen from "./components/scoreboardScreen/ScoreboardScreen.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: planta fuera de la pizarra */}
        <Route path='/' element={
          <>
            <JustAPlantComponent />
            <BoardComponent>
              <MainScreen />
            </BoardComponent>
          </>
        } />

        {/* Rutas que usan solo la pizarra */}
        <Route path='/play' element={
          <BoardComponent>
            <PlayScreen />
          </BoardComponent>
        } />
        <Route path='/scoreboard' element={
          <BoardComponent>
            <ScoreboardScreen />
          </BoardComponent>
        } />
        <Route path='*' element={<div>ERROR 404</div>} />
      </Routes>
      {/*El BackgroundComponent solamente renderiza el fondo de la app (pared)*/}
      <BackgroundComponent />
    </BrowserRouter>
  </StrictMode>
)
