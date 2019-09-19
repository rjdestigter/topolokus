import { Point } from '../types'

type BBox = {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

export default (point: Point, bbox: BBox) =>
    bbox.minX <= point[0] && bbox.minY <= point[1] && bbox.maxX >= point[0] && bbox.maxY >= point[1]
