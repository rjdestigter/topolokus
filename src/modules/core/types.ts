// Aliases
export type Pixel = number
export type Coord = number

export type Point = [Pixel, Pixel, Coord, Coord]
export type Line = Point[]
export type Polygon = [Point, Point, Point, ...Point[]]

export type NewPolygon = undefined | [Point] | [Point, Point] | Polygon

export enum StateType {
    Noop = 'Noop',
    AddPolygon = 'AddPolygon',
}

// State
export interface SharedState {
    polygons: Polygon[]
    mousePosition: [Pixel, Pixel]
    hovering: boolean
}

export interface NoopState {
    type: StateType.Noop
}

export interface AddPolygon {
    type: StateType.AddPolygon
    newPolygon: NewPolygon
}

export type State = SharedState & (NoopState | AddPolygon)

// Actions
export enum ActionTypes {
    AddPolygon = 'AddPolygon',
}
