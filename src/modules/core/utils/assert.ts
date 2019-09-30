import { Point, ShapeTypes, Shape, PointShape, PolygonShape, LineShape, Line } from '../types'

export const hasProp = <K extends string>(prop: K) => <U, T extends { [P in K]: U }>(obj: T) =>
    obj[prop]

type BBox = {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

export const isInBBox = (point: Point, bbox: BBox) =>
    bbox.minX <= point[0] && bbox.minY <= point[1] && bbox.maxX >= point[0] && bbox.maxY >= point[1]

/** Asserts if the given shape is of type [[PolygonShape]] */
export const isPolygonShape = <T>(shape: Shape<T>): shape is PolygonShape<T> =>
    shape.type === ShapeTypes.Polygon

/** Asserts if the given shape is of type [[PointShape]] */
export const isPointShape = <T>(shape: Shape<T>): shape is PointShape<T> =>
    shape.type === ShapeTypes.Point

/** Asserts if the given shape is of type [[LineShape]] */
export const isLineShape = <T>(shape: Shape<T>): shape is LineShape<T> =>
    shape.type === ShapeTypes.Line

export const isEqual = <A, B extends A>(value: A) => (compare: B) => value === compare

export const isNotOfTypeNbr = <T>(value: number | T): value is T => typeof value !== 'number'

export const isPolygon = (points?: Point[]): points is Line => points != null && points.length > 2
