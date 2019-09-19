import { Shape, ShapeTypes, LineShape, PointShape, PolygonShape } from '../types'

/** Returns the first element of a tuple */
export const first = <A, B>(t: [A, B]): A => t[0]

export const emptyArray: any[] = []

export const returnEmptyArray = <T>(value: T): T =>
    Array.isArray(value) && value.length <= 0 ? (emptyArray as any) : value

export const memoize = <A, B>(f: (a: A) => B) => {
    let previousA: A | undefined
    let previousB: B | undefined

    return (a: A): B => {
        if (a !== previousA) {
            previousA = a
            previousB = f(a)
        }

        return returnEmptyArray(previousB as B)
    }
}

export const isPolygonShape = <T>(shape: Shape<T>): shape is PolygonShape<T> =>
    shape.type === ShapeTypes.Polygon

export const isPointShape = <T>(shape: Shape<T>): shape is PointShape<T> =>
    shape.type === ShapeTypes.Point

export const isLineShape = <T>(shape: Shape<T>): shape is LineShape<T> =>
    shape.type === ShapeTypes.Line
