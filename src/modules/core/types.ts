import { AddState } from './add/types'

/** Type alias for pixels */
export type Pixel = number

/** Type alias for x- and y coordinates */
export type Coordinate = number

/**
 * An (x, y) coordiante. The first 2 number represent the pixel
 * cordiantes while the optional second set of numbers are the
 * origina coordiantes. For example longitude and lattitude values.
 *
 * The system preservers the original coordiantes to prevent having
 * to convert them back and forth if they aren't changed.
 */
export type Point = [Pixel, Pixel, Coordinate, Coordinate] | [Pixel, Pixel]

/**
 * A list of 2- or more [[Point]]s
 *
 * I would've preferred to tyep it [Point, Point, ...Point[]]
 */
export type Line = Point[]

/**
 * A list of list of points where the first element in the list
 * is clockwise and the rest of the list counter clockwise
 * representing holes.
 *
 * I would've preferred to type it: [Point, Point, Point, ...Point[]][]
 * since each ring should have at least 3 points.
 */
export type Polygon = Line[]

export enum ShapeTypes {
    Point = 'Point',
    Polygon = 'Polygon',
    Line = 'Line',
}

export type PointShape<T> = {
    type: ShapeTypes.Point
    shape: Point
    meta: T
}

export type PolygonShape<T> = {
    type: ShapeTypes.Polygon
    shape: Polygon
    meta: T
}

export type LineShape<T> = {
    type: ShapeTypes.Line
    shape: Line
    meta: T
}

export type Shape<T> = PointShape<T> | PolygonShape<T> | LineShape<T>

export enum StateType {
    Noop = 'Noop',
    AddPolygon = 'AddPolygon',
}

// State
export interface SharedState<T> {
    readonly mousePosition: [Pixel, Pixel]
    readonly hovering: boolean
    // readonly hoverIndex: number
    readonly selectedIndices: number[]
}

export interface NoopState {
    readonly value: StateType.Noop
}

export type PossibleStates = NoopState | AddState
export type State<T> = SharedState<T> & PossibleStates

// Actions
export enum EventTypes {
    SelectPolygon = 'SelectPolygon',
    EditPolygon = 'EditPolygon',
    RemovePolygon = 'RemovePolygon',
}
