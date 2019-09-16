import React from 'react'
import logo from './logo.svg'
import './App.css'

import Map from './modules/map'

const App: React.FC = () => {
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
            </header>
            <div id="map">
                <Map />
            </div>
        </div>
    )
}

export default App
