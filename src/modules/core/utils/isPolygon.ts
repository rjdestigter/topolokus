import { Point, Line } from '../types'

export default (points?: Point[]): points is Line => points != null && points.length > 2
