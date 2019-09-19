import { Polygon } from '../types'

export default (polygon: Polygon) =>
    polygon[0].reduce(
        (acc, [x, y]) => {
            if (x < acc.minX) acc.minX = x
            if (y < acc.minY) acc.minY = y
            if (acc.maxX === Infinity || x > acc.maxX) acc.maxX = x
            if (acc.maxY === Infinity || y > acc.maxY) acc.maxY = y
            return acc
        },
        {
            minX: Infinity,
            minY: Infinity,
            maxX: Infinity,
            maxY: Infinity,
        },
    )
