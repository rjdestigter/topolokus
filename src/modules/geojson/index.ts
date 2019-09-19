import core from '../core'
import { Point, ShapeTypes, PolygonShape } from '../core/types'

import { of, Subject } from 'rxjs'
import geojson from '../../data/geosample.json'
import { tap } from 'rxjs/operators'

type From = (coordinate: number[]) => Point
type To = (coordinate: Point) => number[]

const convertGeoJson = (from: From): PolygonShape<number>[] =>
    geojson.features
        .filter(feature => feature.properties.ZoneID < 400)
        .map(feature => {
            return {
                type: ShapeTypes.Polygon,
                shape: feature.geometry.coordinates.map(ring => ring.map(point => from(point))),
                meta: feature.properties.ZoneID,
            }
        })

export default (convert: { from: From; to: To }) => (canvas: HTMLCanvasElement) => {
    const shapes$ = new Subject<PolygonShape<number>[]>()

    const api = core(shapes$.pipe(tap(() => console.info('Updating after zoom/pan'))))(canvas)

    const refresh = () => shapes$.next(convertGeoJson(convert.from))

    refresh()

    return Object.assign(api, { refresh })
}
