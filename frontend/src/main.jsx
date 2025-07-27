import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

//Components
import BackgroundComponent from './components/backgroundComponent/BackgroundComponent.jsx'
import BoardComponent from './components/BoardComponent/BoardComponent.jsx';
import JustAPlantComponent from './justAPlantComponent/JustAPlantComponent.jsx'
import HomeScreen from './components/homeScreen/HomeScreen.jsx';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import AuthCheck from './components/AuthCheck/AuthCheck.jsx';
import OrientationGuard from './components/OrientationGuard/OrientationGuard.jsx';

// Hooks
import { useModerationPreload } from './hooks/useModerationPreload.js';

//Screens
import PlayWrapper from "./components/PlayWrapper/PlayWrapper.jsx";
import ScoreboardScreen from "./components/scoreboardScreen/ScoreboardScreen.jsx";

// Componente principal que incluye la precarga de moderación
const App = () => {
  // Precargar el modelo de moderación en segundo plano
  const { isPreloaded, isPreloading, error } = useModerationPreload();

  return (
    <OrientationGuard>
      <BrowserRouter>
        <Routes>
          {/* Ruta principal: planta fuera de la pizarra */}
          <Route path='/' element={
            <>
              <JustAPlantComponent />
              <BoardComponent>
                <HomeScreen />
              </BoardComponent>
            </>
          } />

          {/* Ruta de verificación de autenticación */}
          <Route path='/auth-check' element={<AuthCheck />} />
          
          {/* Rutas protegidas que requieren autenticación */}
          <Route path='/play' element={
            <ProtectedRoute>
              <PlayWrapper />
            </ProtectedRoute>
          } />
          <Route path='/scoreboard' element={
            <ProtectedRoute>
              <>
                <JustAPlantComponent />
                <BoardComponent>
                  <ScoreboardScreen />
                </BoardComponent>
              </>
            </ProtectedRoute>
          } />
          <Route path='*' element={<div>ERROR 404</div>} />
        </Routes>
        {/*El BackgroundComponent solamente renderiza el fondo de la app (pared)*/}
        <BackgroundComponent />
      </BrowserRouter>
    </OrientationGuard>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
