import { AddState } from './add/types'

// Aliases
export type Pixel = number
export type Coord = number

export type Point = [Pixel, Pixel, Coord, Coord] | [Pixel, Pixel]
export type Line = Point[]
export type Polygon = Line[]

export enum StateType {
    Noop = 'Noop',
    AddPolygon = 'AddPolygon',
}

// State
export interface SharedState {
    readonly polygons: Polygon[]
    readonly mousePosition: [Pixel, Pixel]
    readonly hovering: boolean
}

export interface NoopState extends SharedState {
    readonly value: StateType.Noop
}

export type State = NoopState | AddState

// Actions
export enum EventTypes {
    SelectPolygon = 'SelectPolygon',
    EditPolygon = 'EditPolygon',
    RemovePolygon = 'RemovePolygon',
}
