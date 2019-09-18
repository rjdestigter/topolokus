import { AddState } from './add/types'

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
    value: StateType.Noop
}

export type State = NoopState | AddState

// Actions
export enum EventTypes {
    SelectPolygon = 'SelectPolygon',
    EditPolygon = 'EditPolygon',
    RemovePolygon = 'RemovePolygon',
}
