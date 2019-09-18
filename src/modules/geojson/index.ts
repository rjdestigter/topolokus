import withCoreCanvas from '../core'
import { state$ } from '../core/observables'
import { Point, Polygon as CorePolygon } from '../core/types'

import {
    Polygon,
    MultiPolygon,
    Feature,
    FeatureCollection,
    GeometryCollection,
} from '@turf/helpers'

type PolyLike = Polygon | MultiPolygon
type Data = PolyLike | Feature<PolyLike> | FeatureCollection<PolyLike>
type State = {
    data: Data[]
}

const fromPolygon = (polygon: Polygon): CorePolygon =>
    polygon.coordinates.map(ring => ring.map(([lng, lat]) => [lng, lat]))

type From = (coordinate: number[]) => Point
type To = (coordinate: Point) => number[]

export default (convert: { from: From; to: To }) => (canvas: HTMLCanvasElement) => {
    const api = withCoreCanvas(canvas)

    let state: State = {
        data: [],
    }

    state = state
    return api
}
