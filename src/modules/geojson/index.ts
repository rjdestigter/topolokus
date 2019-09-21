import core from '../core'
import { Point, ShapeTypes, PolygonShape, Shape, ConvertPoint } from '../core/types'

import { of, Subject } from 'rxjs'
import geojson from '../../data/nl.json'
import { tap } from 'rxjs/operators'
import { Polygon as P, MultiPolygon as M } from '@turf/helpers'

const data: typeof geojson.features = geojson.features

type G = typeof data[0]['geometry']

const isP = (g: G): g is P => g.type === 'Polygon'
const isM = (g: G): g is M => g.type === 'MultiPolygon'

const convertGeoJson = (from: ConvertPoint['from']): PolygonShape<number>[] =>
    // @ts-ignore
    data
        // .filter(feature => true || feature.properties.ZoneID % 2 === 0)
        .flatMap((feature): Shape<number>[] => {
            const geom = feature.geometry

            if (isP(geom)) {
                return [
                    {
                        type: ShapeTypes.Polygon,
                        shape: geom.coordinates.map(ring => ring.map(point => from(point))),

                        meta: Math.floor(Math.random() * 20) + 1,
                    },
                ]
            } else if (isM(geom)) {
                return geom.coordinates.map(poly => {
                    return {
                        type: ShapeTypes.Polygon,
                        shape: poly.map(ring => ring.map(point => from(point))),
                        meta: Math.floor(Math.random() * 20) + 1,
                    }
                })
            }
            return []
        })

export default (convert: ConvertPoint) => (canvas: HTMLCanvasElement, mouseCanvas = canvas) => {
    const shapes$ = new Subject<PolygonShape<number>[]>()

    const api = core(convert, shapes$)(canvas, mouseCanvas)

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
                        // ZoneID: 2,
                    },
                })

                refresh()
            }),
        )
        .subscribe()

    refresh()

    return Object.assign(api, { refresh })
}
