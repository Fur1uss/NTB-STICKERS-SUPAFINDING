import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

//Components
import BackgroundComponent from './components/backgroundComponent/BackgroundComponent.jsx'
import BoardComponent from './components/BoardComponent/BoardComponent.jsx';
import MainScreen from './components/mainScreen/MainScreen.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MainScreen />
    <BoardComponent />
    {/*El BackgroundComponent solamente renderiza el fondo de la app (pared)*/}
    <BackgroundComponent />
  
  </StrictMode>
)
