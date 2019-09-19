import core from '../core'
import { Point, Polygon as CorePolygon, Shape } from '../core/types'

import { Polygon, MultiPolygon } from '@turf/helpers'
import { of, Observable } from 'rxjs'

type PolyLike = Polygon | MultiPolygon
type Data = Polygon // PolyLike | Feature<PolyLike> | FeatureCollection<PolyLike>
type State = {
    data: Data[]
}

const fromPolygon = (polygon: Polygon): CorePolygon =>
    polygon.coordinates.map(ring => ring.map(([lng, lat]) => [lng, lat]))

type From = (coordinate: number[]) => Point
type To = (coordinate: Point) => number[]

export default (convert: { from: From; to: To }) => (canvas: HTMLCanvasElement) => {
    const shapes$: Observable<Shape<any>[]> = of([])

    const api = core(shapes$)(canvas)

    return api
}
