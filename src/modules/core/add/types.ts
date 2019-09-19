import { Point, StateType } from '../types'

export interface AddState {
    readonly value: StateType.AddPolygon
    readonly newPolygon: Point[]
}
