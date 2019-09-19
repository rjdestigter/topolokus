import core from '../core'
import { Point, ShapeTypes, PolygonShape } from '../core/types'

import { of, Subject } from 'rxjs'
import geojson from '../../data/geosample.json'

type From = (coordinate: number[]) => Point
type To = (coordinate: Point) => number[]

const convertGeoJson = (from: From): PolygonShape<null>[] =>
    geojson.features.map(feature => {
        return {
            type: ShapeTypes.Polygon,
            shape: feature.geometry.coordinates.map(ring => ring.map(point => from(point))),
            meta: null,
        }
    })

export default (convert: { from: From; to: To }) => (canvas: HTMLCanvasElement) => {
    const shapes$ = new Subject<PolygonShape<null>[]>()

    const api = core(shapes$)(canvas)

    const refresh = () => shapes$.next(convertGeoJson(convert.from))

    refresh()

    return Object.assign(api, { refresh })
}
