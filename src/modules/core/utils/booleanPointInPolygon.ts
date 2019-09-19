import { Polygon, Point, Line } from '../types'
import boundingBox from './bbox'
import inBBox from './inBbox'

export default function booleanPointInPolygon(
    point: Point,
    polygon: Polygon,
    options: {
        ignoreBoundary?: boolean
    } = {},
) {
    const bbox = boundingBox(polygon)

    // Quick elimination if point is not inside bbox
    if (inBBox(point, bbox) === false) {
        return false
    }

    let insidePoly = false

    if (inRing(point, polygon[0], options.ignoreBoundary)) {
        let inHole = false
        let k = 1
        // check for the point in any of the holes
        while (k < polygon.length && !inHole) {
            if (inRing(point, polygon[k], !options.ignoreBoundary)) {
                inHole = true
            }
            k++
        }
        if (!inHole) {
            insidePoly = true
        }
    }

    return insidePoly
}

function inRing(point: Point, ring: Line, ignoreBoundary?: boolean) {
    let isInside = false
    if (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) {
        ring = ring.slice(0, ring.length - 1)
    }

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0]
        const yi = ring[i][1]
        const xj = ring[j][0]
        const yj = ring[j][1]
        const onBoundary =
            point[1] * (xi - xj) + yi * (xj - point[0]) + yj * (point[0] - xi) === 0 &&
            (xi - point[0]) * (xj - point[0]) <= 0 &&
            (yi - point[1]) * (yj - point[1]) <= 0
        if (onBoundary) {
            return !ignoreBoundary
        }
        const intersect =
            yi > point[1] !== yj > point[1] &&
            point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
        if (intersect) {
            isInside = !isInside
        }
    }

    return isInside
}
