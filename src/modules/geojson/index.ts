import core from '../core'
import { Point, ShapeTypes, PolygonShape } from '../core/types'

import { of, Subject } from 'rxjs'
import geojson from '../../data/geosample.json'
import { tap } from 'rxjs/operators'

type From = (coordinate: number[]) => Point
type To = (coordinate: Point) => number[]

const data: typeof geojson.features = geojson.features

const convertGeoJson = (from: From): PolygonShape<number>[] =>
    data
        .filter(feature => true || feature.properties.ZoneID % 2 === 0)
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

    api.api.onAdd$
        .pipe(
            tap(event => {
                const coordinates = event.payload[0].map(px => convert.to(px))
                coordinates.push(coordinates[0])
                data.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [coordinates],
                    },
                    // @ts-ignore
                    properties: {
                        ZoneID: 2,
                    },
                })

                refresh()
            }),
        )
        .subscribe()

    refresh()

    return Object.assign(api, { refresh })
}
