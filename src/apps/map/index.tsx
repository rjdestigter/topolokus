import React from 'react'
import { Map as ReactLeafletMap, Popup, TileLayer, useLeaflet, Pane, Circle } from 'react-leaflet'

import '../../leaflet/leaflet.css'
import { canvas } from 'leaflet'

import { withCanvas } from '../../modules/core'

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

// type CanvasLayer = undefined | ReturnType<typeof createCanvasLayer>

/* const toLngLat = (map: LeafletMap) => ([x, y]: number[]): number[] => {
    const point = map.containerPointToLatLng([x, y])
    return [point.lng, point.lat]
}

const fromLngLat = (map: LeafletMap) => ([lng, lat]: number[]): number[] => {
    const point = map.latLngToContainerPoint([lat, lng])
    return [point.x, point.y]
}
 */
const Canvas = () => {
    const context = useLeaflet()

    React.useEffect(() => {
        if (context.map != null) {
            const map = context.map
            const canvasLayer = createCanvasLayer(context.pane)
            // const mouseCanvasLayer = createCanvasLayer(context.pane)
            canvasLayer.addTo(context.map)
            // mouseCanvasLayer.addTo(context.map)
            // const layer = circle(position, { renderer: canvasLayer, radius: 1000 })
            // layer.addTo(context.map)

            Object.assign(window, { canvasLayer })

            const elCanvas: HTMLCanvasElement = (canvasLayer as any)._container
            // const elMouseCanvasLayer: HTMLCanvasElement = (mouseCanvasLayer as any)._container

            const api = withCanvas(elCanvas)
            const onZoomOrMove = () => {}

            map.dragging.disable()
            Object.assign(window, { api })

            map.addEventListener('zoom move', onZoomOrMove)

            return () => {
                map.removeEventListener('zoom move', onZoomOrMove)
                map.removeLayer(canvasLayer)
                // map.removeLayer(mouseCanvasLayer)
                api.done()
            }
        }
    }, [
        context.map,
        context.map && context.map.getCenter().lat,
        context.map && context.map.getCenter().lng,
    ])

    return null
}

export default () => {
    return (
        <Map>
            <Canvas />
        </Map>
    )
}
