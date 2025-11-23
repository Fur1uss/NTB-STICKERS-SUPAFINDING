import React from 'react';
import './BoardComponent.css';

const BoardComponent = ({children}) => {
  return (
    <div className="boardContainer">
        <img 
          src="/board.webp" 
          alt="Board Background" 
          className="boardImage"
        />
        <div className='boardDynamicContainer'>
            {children}
        </div>
    </div>
  )
}

export default BoardComponent;