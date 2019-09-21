import _ from 'lodash'

import {
    AllGeoJSON,
    Feature,
    FeatureCollection,
    GeoJSONObject,
    Geometries,
    GeometryCollection,
    MultiPolygon,
    Polygon,
    Position,
    Types as GeoJSONTypes,
} from '@turf/helpers'

import {
    PolyLike,
    PositionLike,
    QFeature,
    QFeatureCollection,
    QMultiPolygon,
    QPolygon,
    QPolyLike,
    QPosition,
} from './types'

type Project = (xy: number[]) => number[]

interface Collect {
    coordinates: QPosition[]
    lines: [QPosition, QPosition][]
}

const defaultCollect = (): Collect => ({ coordinates: [], lines: [] })

export const pointPixelsAreEqual = ([x1, y1]: PositionLike, [x2, y2]: PositionLike): boolean => {
    console.log(`${x1} === ${x2} && ${y1} === ${y2}`)
    const eq = _.isEqual([x1, y1], [x2, y2])
    console.log('Eq: ' + eq)
    return eq
}

export const projectGeometry = (project: Project) => (collect: Collect = defaultCollect()) => (
    geom: Polygon | MultiPolygon,
): QPolygon | QMultiPolygon => {
    switch (geom.type) {
        case 'MultiPolygon':
            return projectMultiPolygon(project)(collect)(geom)
        case 'Polygon':
            return projectPolygon(project)(collect)(geom)
        default:
            return geom
    }
}

export const projectGeoJSON = (project: Project) => (collect: Collect = defaultCollect()) => (
    geom: PolyLike,
): QPolyLike => {
    switch (geom.type) {
        case 'FeatureCollection':
            return projectFeatureCollection(project)(collect)(geom as any)
        case 'Feature':
            return projectFeature(project)(collect)(geom)
        // case 'GeometryCollection':
        //   return projectGeometryCollection(project)(collect)(geom)
        default:
            return projectGeometry(project)(collect)(geom)
    }
}

export const projectFeature = (project: Project) => (collect: Collect = defaultCollect()) => (
    geom: Feature<Polygon | MultiPolygon>,
): QFeature<QPolygon | QMultiPolygon> => ({
    ...geom,
    geometry: projectGeometry(project)(collect)(geom.geometry),
})

export const projectFeatureCollection = (project: Project) => (
    collect: Collect = defaultCollect(),
) => (
    geom: FeatureCollection<Polygon | MultiPolygon>,
): QFeatureCollection<QPolygon | QMultiPolygon> => ({
    ...geom,
    features: geom.features.map(projectFeature(project)(collect)),
})

// export const projectGeometryCollection = (project: Project) => (collect: Collect = defaultCollect()) => (
//   geom: any
// ): GeometryCollection => ({
//   ...geom,
//   geometries: geom.geometries.map(projectGeometry(project)(collect))
// })

export const projectMultiPolygon = (project: Project) => (collect: Collect = defaultCollect()) => (
    polygon: MultiPolygon,
): QMultiPolygon => ({
    ...polygon,
    coordinates: polygon.coordinates.map(poly => poly.map(projectPositions(project)(collect))),
})

export const projectPolygon = (project: Project) => (collect: Collect = defaultCollect()) => (
    polygon: Polygon,
): QPolygon => {
    return {
        ...polygon,
        coordinates: polygon.coordinates.map(projectPositions(project)(collect)),
    }
}

export const projectPositions = (project: Project) => (collect: Collect = defaultCollect()) => (
    coords: Position[],
): QPosition[] =>
    coords.map((coord, index) => {
        const projected = project(coord)

        const point: QPosition = [projected[0], projected[1], coord[0], coord[1]]
        collect.coordinates.push(point)

        if (index > 0) {
            collect.lines.push([collect.coordinates[collect.coordinates.length - 2], point])

            if (index === coords.length - 1) {
                collect.lines.push([
                    point,
                    collect.coordinates[collect.coordinates.length - coords.length],
                ])
            }
        }

        return point
    })

export const pointToLineDistance = ([x, y]: number[], [[x1, y1], [x2, y2]]: number[][]) => {
    const A = x - x1
    const B = y - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    if (lenSq !== 0) {
        // in case of 0 length line
        param = dot / lenSq
    }

    let xx: number
    let yy: number

    if (param < 0) {
        xx = x1
        yy = y1
    } else if (param > 1) {
        xx = x2
        yy = y2
    } else {
        xx = x1 + param * C
        yy = y1 + param * D
    }

    const dx = x - xx
    const dy = y - yy
    return [[xx, yy], Math.sqrt(dx * dx + dy * dy)] as [number[], number]
}

/**
 *
 * @param position
 * @param lines
 */
export const findLineSnapPosition = (position: Position, lines: [QPosition, QPosition][]) => {
    let point: Position | undefined
    let distance = -1
    let line: [QPosition, QPosition] | undefined

    lines.find((poly): boolean => {
        const [xy, d] = pointToLineDistance(position, poly)

        if (d <= 5) {
            point = xy
            distance = d
            line = poly

            return true
        }

        return false
    })

    if (distance >= 0 && point != null && line != null) {
        return { point, distance, line }
    }

    return undefined
}

const fromQPosition2Position = ([, , lng, lat]: QPosition): Position => [lng, lat]

const fromQPositions2Positions = (qPositions: QPosition[]): Position[] =>
    qPositions.map(fromQPosition2Position)

const fromQPositionsSets2PositionsSets = (sets: QPosition[][]): Position[][] =>
    sets.map(fromQPositions2Positions)

const fromQPolygon2Polygon = (qPolygon: QPolygon): Polygon => {
    return {
        ...qPolygon,
        coordinates: fromQPositionsSets2PositionsSets(qPolygon.coordinates),
    }
}

const fromQMultiPolygon2MultiPolygon = (qMultiPolygon: QMultiPolygon): MultiPolygon => {
    return {
        ...qMultiPolygon,
        coordinates: qMultiPolygon.coordinates.map(fromQPositionsSets2PositionsSets),
    }
}

const fromQGeometry2Geometry = (geometry: QPolygon | QMultiPolygon) => {
    if (geometry.type === 'MultiPolygon') {
        return fromQMultiPolygon2MultiPolygon(geometry)
    }

    return fromQPolygon2Polygon(geometry)
}

const fromQFeature2Feature = (
    feature: QFeature<QPolygon | QMultiPolygon>,
): Feature<Polygon | MultiPolygon> => {
    return {
        ...feature,
        geometry: fromQGeometry2Geometry(feature.geometry),
    }
}

export const fromQLikeToPolyLike = (qLike: QPolyLike): PolyLike => {
    if (qLike.type === 'FeatureCollection') {
        return {
            ...qLike,
            features: qLike.features.map(fromQFeature2Feature),
        }
    } else if (qLike.type === 'Feature') {
        return fromQFeature2Feature(qLike)
    }

    return fromQGeometry2Geometry(qLike)
}

export const mapGeometry = (
    f: (geometry: QPolygon | QMultiPolygon) => QPolygon | QMultiPolygon,
) => (geometry: QPolygon | QMultiPolygon): QPolygon | QMultiPolygon => {
    const nextGeometry = f(geometry)

    if (nextGeometry !== geometry) {
        return nextGeometry
    }

    return geometry
}

export const mapFeature = (f: (geometry: QPolygon | QMultiPolygon) => QPolygon | QMultiPolygon) => (
    feature: QFeature<QPolygon | QMultiPolygon>,
): QFeature<QPolygon | QMultiPolygon> => {
    const nextGeometry = f(feature.geometry)

    if (nextGeometry !== feature.geometry) {
        return {
            ...feature,
            geometry: nextGeometry,
        }
    }

    return feature
}

export const mapFeatureCollection = (
    f: (geometry: QPolygon | QMultiPolygon) => QPolygon | QMultiPolygon,
) => (
    featureCollection: QFeatureCollection<QPolygon | QMultiPolygon>,
): QFeatureCollection<QPolygon | QMultiPolygon> => {
    const nextFeatures: QFeature<QPolygon | QMultiPolygon>[] = []
    let didChange = false

    featureCollection.features.forEach(feature => {
        const nextFeature = mapFeature(f)(feature)

        if (nextFeature !== feature) {
            didChange = true
            nextFeatures.push(nextFeature)
        }
    })

    if (didChange) {
        return {
            ...featureCollection,
            features: nextFeatures,
        }
    }

    return featureCollection
}

export const mapPolyLike = (
    f: (geometry: QPolygon | QMultiPolygon) => QPolygon | QMultiPolygon,
) => (polyLike: QPolyLike): QPolyLike => {
    if (polyLike.type === 'Feature') {
        return mapFeature(f)(polyLike)
    } else if (polyLike.type === 'FeatureCollection') {
        return mapFeatureCollection(f)(polyLike)
    }

    return mapGeometry(f)(polyLike)
}

export const injectLineSnapPosition = (
    ring: QPosition[],
    line: [QPosition, QPosition],
    point: QPosition,
) => {
    let didInject = false

    const nextRing = ring.reduce(
        (acc, coord) => {
            const previous = acc[acc.length - 1]

            if (
                didInject === false &&
                previous &&
                pointPixelsAreEqual(previous, line[0]) &&
                pointPixelsAreEqual(coord, line[1])
            ) {
                didInject = true
                acc.push(point, coord)
            } else {
                acc.push(coord)
            }

            return acc
        },
        [] as QPosition[],
    )

    return { didInject, ring: nextRing }
}

export const mapMouseEventToCoords = (evt: MouseEvent): [number, number] => [
    evt.offsetX,
    evt.offsetY,
]
