import { Map } from 'leaflet'
import { createCanvasLayer, fromLngLat, toLngLat, translateOffsetOfCanvas } from './utils'
import plopGeoJSON from '../../geojson'
import { FeatureCollection, Feature, Polygon, MultiPolygon } from '@turf/helpers'

export type Geometry =
    | Feature<Polygon | MultiPolygon>
    | FeatureCollection<Polygon | MultiPolygon>
    | Polygon
    | MultiPolygon

export default (map: Map, options: { pane?: string } = {}) => (geometries: Geometry[]) => {
    const pane = options.pane || (map.createPane('plop') && 'plop')
    const canvasLayer = createCanvasLayer(pane)
    const mouseCanvasLayer = createCanvasLayer(pane)

    canvasLayer.addTo(map)
    mouseCanvasLayer.addTo(map)

    const elCanvas: HTMLCanvasElement = (canvasLayer as any)._container
    const elMouseCanvasLayer: HTMLCanvasElement = (mouseCanvasLayer as any)._container
    const translateOffset = translateOffsetOfCanvas(elCanvas)

    const plop = plopGeoJSON({
        from: fromLngLat(map),
        to: toLngLat(map),
    })(elCanvas, elMouseCanvasLayer, {
        mapOffset: translateOffset,
    })(geometries)

    map.addEventListener('moveend zoomend', plop.refresh)

    const unsubscribe = () => {
        map.removeEventListener('moveend zoomend', plop.refresh)
        map.removeLayer(canvasLayer)
        map.removeLayer(mouseCanvasLayer)
        plop.done()
    }

    return Object.assign(plop, { unsubscribe })
}
