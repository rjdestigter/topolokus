import { Point, StateType, SharedState } from '../types'

export interface AddState extends SharedState {
    readonly value: StateType.AddPolygon
    readonly newPolygon: Point[]
}
