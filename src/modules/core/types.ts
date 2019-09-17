// Aliases
export type Pixel = number
export type Coord = number

export type Point = [Pixel, Pixel, Coord, Coord] | [Pixel, Pixel]
export type Line = Point[]
export type Polygon = Point[]

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

export interface NoopState extends SharedState {
    type: StateType.Noop
}

export interface AddPolygonState extends SharedState {
    type: StateType.AddPolygon
    newPolygon: Polygon
}

export type State = NoopState | AddPolygonState

// Actions
export enum ActionTypes {
    // Adding
    AddPolygon = 'AddPolygon',
    AddPointToNewPolygon = 'AddPointToNewPolygon',
    SubmitNewPolygon = 'SubmitNewPolygon',
    CancelNewPolygon = 'CancelNewPolygon',
    SelectPolygon = 'SelectPolygon',
    EditPolygon = 'EditPolygon',
    RemovePolygon = 'RemovePolygon',
}

export type AddPolygonAction = {
    type: ActionTypes.AddPolygon
}

export type AddPointToNewPolygonAction = {
    type: ActionTypes.AddPointToNewPolygon
    payload: [Pixel, Pixel]
}

export type SubmitNewPolygonAction = {
    type: ActionTypes.SubmitNewPolygon
}

export type CancelNewPolygonAction = {
    type: ActionTypes.CancelNewPolygon
}

export type Action =
    | AddPolygonAction
    | AddPointToNewPolygonAction
    | SubmitNewPolygonAction
    | CancelNewPolygonAction
