import React, { useEffect, useState } from 'react';
import './JustAPlantComponent.css';

const JustAPlantComponent = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
    }, []);

    return(
        <div className={`plantContainer${show ? ' plant-animate' : ''}`}>
            <img src="/plant.webp" alt="" />
        </div>
    )
}

export default JustAPlantComponent;