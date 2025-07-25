import React from 'react';
import './boardComponent.css';

const BoardComponent = ({children}) => {
  return (
    <div className="boardContainer">
        <div className='boardDyinamicContainer'>
            {children}
        </div>
    </div>
  )
}

export default BoardComponent;