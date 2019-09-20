import React from 'react'
import { Map as ReactLeafletMap, Popup, TileLayer, useLeaflet, Pane, Circle } from 'react-leaflet'
import * as _ from 'lodash'

import '../../leaflet/leaflet.css'
import { canvas, Map as LeafletMap } from 'leaflet'
import { geoJSON } from 'leaflet'

import topolokus from '../../modules/geojson'

// const position2: [number, number] = [51.885, 5.0509] // [51.505, -0.09]

import geojson from '../../data/geosample.json'
import { Point } from '../../modules/core/types'

const position: [number, number] = [52.1326, 5.2913] // [51.505, -0.09]
const Map: React.FC = (props: { children?: React.ReactNode }) => (
    <ReactLeafletMap center={position} zoom={8}>
        <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />

        <Pane name="canvas">
            {props.children}
            <div>xyt</div>
        </Pane>
    </ReactLeafletMap>
)

const createCanvasLayer = (pane?: string) => canvas({ padding: 0, pane })

// type CanvasLayer = undefined | ReturnType<typeof createCanvasLayer>

const toLngLat = (map: LeafletMap) => ([x, y, lng, lat]: Point): [number, number] => {
    const point = map.layerPointToLatLng([x, y])
    return [lng || point.lng, lat || point.lat]
}

const fromLngLat = (map: LeafletMap) => ([lng, lat]: number[]): Point => {
    const point = map.latLngToLayerPoint([lat, lng + 0])
    return [point.x, point.y, lng, lat]
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
            // @ts-ignore
            // const layer = geoJSON(geojson.features[0].geometry as any, { renderer: canvasLayer })

            // layer.addTo(context.map)

            Object.assign(window, { canvasLayer })

            const elCanvas: HTMLCanvasElement = (canvasLayer as any)._container
            const elMouseCanvasLayer: HTMLCanvasElement = (mouseCanvasLayer as any)._container

            const api = topolokus({
                from: fromLngLat(map),
                to: toLngLat(map),
            })(elCanvas, elMouseCanvasLayer)

            const onZoomOrMove = _.debounce(api.refresh)

            // map.dragging.disable()
            Object.assign(window, { api })

            map.addEventListener('moveend zoomend', onZoomOrMove)

            return () => {
                map.removeEventListener('moveend zoomend', onZoomOrMove)
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
