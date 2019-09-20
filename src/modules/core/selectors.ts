import { State, Point, Shape, StateType, PointShape, LineShape, PolygonShape } from './types'
import { memoize, isPolygonShape, isPointShape, isLineShape, emptyArray } from './utils'

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
export const convertLineShapesToListOfLines = memoize(<T>(lineShapes: LineShape<T>[]) =>
    lineShapes.flatMap(lineShape => lineShape.shape),
)
export const convertPolygonShapesToListOfPolygons = memoize(<T>(polygonShapes: PolygonShape<T>[]) =>
    polygonShapes.flatMap(polygonShape => polygonShape.shape.flat()),
)

/**
 * Redduces a list of polygons into a list of points
 */
export const convertShapesToListOfPoints = memoize(<T>(shapes: Shape<T>[]): Point[] => [
    ...convertPointShapesToListOfPoints(filterPointShapes(shapes)),
    ...convertLineShapesToListOfLines(filterLineShapes(shapes)),
    ...convertPolygonShapesToListOfPolygons(filterPolygonShapes(shapes)),
])

// export const newPolygonS = (state: State<any>): Point[] => {
//     if (state.value === StateType.AddPolygon) {
//         return state.newPolygon
//     }

//     return emptyArray
// }
