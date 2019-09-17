import { Point, Polygon } from '../types'

export default (points?: Point[]): points is Polygon => points != null && points.length > 2
