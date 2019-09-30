import { of, Subject, BehaviorSubject } from 'rxjs'

// Plop core
import core from '../core'
import { Point, ShapeTypes, PolygonShape, Shape, ConvertPoint } from '../core/types'

import { tap, map } from 'rxjs/operators'
import { FeatureCollection, Feature, Polygon, MultiPolygon } from '@turf/helpers'

export type Geometry =
    | Feature<Polygon | MultiPolygon>
    | FeatureCollection<Polygon | MultiPolygon>
    | Polygon
    | MultiPolygon

const isPolygon = (geometry: Polygon | MultiPolygon): geometry is Polygon =>
    geometry.type === 'Polygon'

const isMultiPolygon = (geometry: Polygon | MultiPolygon): geometry is MultiPolygon =>
    geometry.type === 'MultiPolygon'

type From = ConvertPoint['from']
type Ring = Polygon['coordinates'][0]

const rand = () => Math.floor(Math.random() * 20) + 1

const ring2points = (from: From) => ([, ...ring]: Ring) => ring.map(([x, y]) => from([x, y]))

const polygon2shape = (from: From) => <G extends Polygon>(polygon: G): PolygonShape<number> => ({
    type: ShapeTypes.Polygon,
    shape: polygon.coordinates.map(ring2points(from)),
    meta: rand(),
})

const multiPolygon2shapes = (from: From) => <G extends MultiPolygon>(
    multiPolygon: G,
): PolygonShape<number>[] =>
    multiPolygon.coordinates.map(polygon => ({
        type: ShapeTypes.Polygon,
        shape: polygon.map(ring2points(from)),
        meta: rand(),
    }))

const feature2shapes = (from: From) => <G extends Feature<MultiPolygon | Polygon>>(
    feature: G,
): PolygonShape<number>[] =>
    isPolygon(feature.geometry)
        ? [polygon2shape(from)(feature.geometry)]
        : multiPolygon2shapes(from)(feature.geometry)

const featureCollection2shapes = (from: From) => <
    G extends FeatureCollection<MultiPolygon | Polygon>
>(
    featureCollection: G,
): PolygonShape<number>[] => featureCollection.features.flatMap(feature2shapes(from))

const geometry2shapes = (from: From) => (geometry: Geometry) =>
    geometry.type === 'FeatureCollection'
        ? featureCollection2shapes(from)(geometry)
        : geometry.type === 'Feature'
        ? feature2shapes(from)(geometry)
        : isMultiPolygon(geometry)
        ? multiPolygon2shapes(from)(geometry)
        : [polygon2shape(from)(geometry)]

export const geometries2shapes = (from: From) => (geometries: Geometry[]) =>
    geometries.flatMap(geometry2shapes(from))

export default (convert: ConvertPoint) => (
    canvas: HTMLCanvasElement,
    mouseCanvas: HTMLCanvasElement,
    config: {
        mapOffset?: (xy: [number, number]) => [number, number]
    } = {},
) => (geometries: Geometry[]) => {
    const geometries$ = new BehaviorSubject(geometries)

    const shapes$ = geometries$.pipe(map(geometries2shapes(convert.from)))

    const plop = core(convert, shapes$)(canvas, mouseCanvas, config)

    const refresh = () => geometries$.next(geometries$.getValue())

    plop.api.onAdd$
        .pipe(
            tap(event => {
                const coordinates = event.payload[0].map(px => convert.to(px))
                coordinates.push(coordinates[0])
                const polygon: Polygon = {
                    type: 'Polygon',
                    coordinates: [coordinates],
                }

                geometries$.next([...geometries$.getValue(), polygon])

                refresh()
            }),
        )
        .subscribe()

    refresh()

    return Object.assign(plop, { refresh })
}
