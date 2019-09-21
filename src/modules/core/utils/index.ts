import { Shape, ShapeTypes, LineShape, PointShape, PolygonShape } from '../types'

// Constants
export const emptyArray: any[] = []

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

// Assertion functions

/** Asserts if the given shape is of type [[PolygonShape]] */
export const isPolygonShape = <T>(shape: Shape<T>): shape is PolygonShape<T> =>
    shape.type === ShapeTypes.Polygon

/** Asserts if the given shape is of type [[PointShape]] */
export const isPointShape = <T>(shape: Shape<T>): shape is PointShape<T> =>
    shape.type === ShapeTypes.Point

/** Asserts if the given shape is of type [[LineShape]] */
export const isLineShape = <T>(shape: Shape<T>): shape is LineShape<T> =>
    shape.type === ShapeTypes.Line

// Tuple functions

/** Converts value a and b into a tuple */
export const tuple = <A, B>(a: A, b: B): [A, B] => [a, b]

/** Returns the first element of a tuple */
export const first = <A>([a]: [A, any]): A => a

/** Returns the second element of a tuple */
export const second = <B>([, b]: [any, B]): B => b

// Array functions

/** Return everything but the last element in an array. */
export const initial = <T>(xs: T[]) => {
    const clone = [...xs]
    clone.splice(xs.length - 1, 1)
    return clone
}

/** Return everything but the first element in array. */
export const tail = <T>(xs: T[]) => {
    const [_, ...t] = xs
    return t
}

/** Retrun the first element in an array. */
export const head = <T>(xs: T[]) => {
    const [h] = xs
    return h
}

export const returnEmptyArray = <T>(value: T): T =>
    Array.isArray(value) && value.length <= 0 ? (emptyArray as any) : value
