import React from 'react'
import './App.css'

import Map from './apps/map'

const App: React.FC = () => {
    return (
        <div className="App">
            <div className="App-header">
                <p>
                    <button
                        onClick={
                            // @ts-ignore
                            () => api.api.addPolygon()
                        }
                    >
                        ADD POLYGON
                    </button>
                </p>
                <ol>
                    <li>
                        Press <i>&quot;a&quot;</i> or click the <i>&quot;Add Polygon&quot;</i>{' '}
                        button to start drawing.
                    </li>
                    <li>
                        Press <i>&quot;Enter&quot;</i> to finish drawing. You can only finish after
                        at least 3 points are drawn.
                    </li>
                    <li>
                        Press <i>&quot;c&quot;</i> to cancel the operation.
                    </li>
                    <li>
                        Supports:
                        <ul>
                            <li>Snapping</li>
                            <li>Undo & redo with Ctrl-Z/Y while adding points</li>
                        </ul>
                    </li>
                </ol>
            </div>
            <div id="map">
                <Map />
            </div>
        </div>
    )
}

export default App
