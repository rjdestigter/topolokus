import React from 'react'
import { Map as ReactLeafletMap, Popup, TileLayer, useLeaflet, Pane, Circle, LeafletContext } from 'react-leaflet'

import '../../leaflet/leaflet.css'
import { canvas, circle, Map as LeafletMap } from 'leaflet'

import withCanvas from '../core/legacy'

const position: [number, number] = [51.9085, 5.0509] // [51.505, -0.09]
const position2: [number, number] = [51.885, 5.0509] // [51.505, -0.09]

const Map: React.FC = (props: { children?: React.ReactNode }) => (
    <ReactLeafletMap center={position} zoom={13}>
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <Circle center={position2} radius={1000}>
            <Popup>
                A pretty CSS3 popup.
                <br />
                Easily customizable.
            </Popup>
        </Circle>
        <Pane name="canvas">
            {props.children}
            <div>xyt</div>
        </Pane>
    </ReactLeafletMap>
)

const createCanvasLayer = (pane?: string) => canvas({ padding: 0, pane })

type CanvasLayer = undefined | ReturnType<typeof createCanvasLayer>

const toLngLat = (map: LeafletMap) => ([x, y]: number[]): number[] => {
    const point = map.containerPointToLatLng([x, y])
    return [point.lng, point.lat]
}

const fromLngLat = (map: LeafletMap) => ([lng, lat]: number[]): number[] => {
    const point = map.latLngToContainerPoint([lat, lng])
    return [point.x, point.y]
}

const Canvas = () => {
    const context = useLeaflet()
    React.useEffect(() => {
        if (context.map != null) {
            const map = context.map
            const canvasLayer = createCanvasLayer(context.pane)
            const mouseCanvasLayer = createCanvasLayer(context.pane)
            canvasLayer.addTo(context.map)
            mouseCanvasLayer.addTo(context.map)
            // const layer = circle(position, { renderer: canvasLayer, radius: 1000 })
            // layer.addTo(context.map)

            Object.assign(window, { canvasLayer })

            const elCanvas: HTMLCanvasElement = (canvasLayer as any)._container
            const elMouseCanvasLayer: HTMLCanvasElement = (mouseCanvasLayer as any)._container

            const app = withCanvas(elCanvas, elMouseCanvasLayer, fromLngLat(context.map), toLngLat(context.map))
            let data: any[] = []

            if (app) {
                app.store.subscribe(() => {
                    const state = app.store.getState()

                    if (state.selectedPoint != null) {
                        map.dragging.disable()
                    } else if (!map.dragging.enabled()) {
                        map.dragging.enable()
                    }
                    data = state.geoJSON.map(j => j.data)
                })

                map.addEventListener('zoom move', () => app.load(data))

                Object.assign(window, { app })
            }

            return () => {
                map.removeLayer(canvasLayer)
            }
        }
    }, [context.map])

    return null
}

export default () => {
    const [toggled, setToggled] = React.useState(true)

    // React.useEffect(() => {
    //     const timeout = setTimeout(() => {
    //         setToggled(!toggled)
    //     }, 50)

    //     return () => {
    //         clearTimeout(timeout)
    //     }
    // }, [toggled])

    return <Map>{toggled ? <Canvas /> : null}</Map>
}
