import { State, Point, Shape, StateType, PointShape, LineShape, PolygonShape } from './types'
import { memoize, isPolygonShape, isPointShape, isLineShape, emptyArray, last } from './utils'

/**
 * From `[Polygon, T] -> [Polygon]
 */
export const filterPolygonShapes = memoize(<T>(shapes: Shape<T>[]): PolygonShape<T>[] =>
    shapes.filter(isPolygonShape),
)

/** TODO */
export const filterLineShapes = memoize(<T>(shapes: Shape<T>[]): LineShape<T>[] =>
    shapes.filter(isLineShape),
)

/** TODO */
export const filterPointShapes = memoize(<T>(shapes: Shape<T>[]): PointShape<T>[] =>
    shapes.filter(isPointShape),
)

/**
 * Redduces a list of [[PointShape]] into a list of points
 */
export const convertPointShapesToListOfPoints = memoize(<T>(pointShapes: PointShape<T>[]) =>
    pointShapes.map(pointShape => pointShape.shape),
)
export const convertLineShapesToListOfPoints = memoize(<T>(lineShapes: LineShape<T>[]) =>
    lineShapes.flatMap(lineShape => lineShape.shape),
)
export const convertPolygonShapesToListOfPoints = memoize(<T>(polygonShapes: PolygonShape<T>[]) =>
    polygonShapes.flatMap(polygonShape => polygonShape.shape.flat()),
)
export const convertPolygonShapesToListOfLines = memoize(<T>(polygonShapes: PolygonShape<T>[]) =>
    polygonShapes.flatMap(polygonShape =>
        polygonShape.shape.flatMap(ring => {
            const [a, b, ...c] = ring
            return c.reduce(
                (acc, next) => {
                    if (acc.length > 0) {
                        const [, p] = last(acc)
                        acc.push([p, next])
                    }
                    return acc
                },
                [[a, b]] as [Point, Point][],
            )
        }),
    ),
)

/**
 * Redduces a list of polygons into a list of points
 */
export const convertShapesToListOfPoints = memoize(<T>(shapes: Shape<T>[]): Point[] => [
    ...convertPointShapesToListOfPoints(filterPointShapes(shapes)),
    ...convertLineShapesToListOfPoints(filterLineShapes(shapes)),
    ...convertPolygonShapesToListOfPoints(filterPolygonShapes(shapes)),
])

/**
 * Redduces a list of polygons into a list of points
 */
export const convertShapesToListOfLines = memoize(<T>(shapes: Shape<T>[]): [Point, Point][] =>
    convertPolygonShapesToListOfLines(filterPolygonShapes(shapes)),
)
