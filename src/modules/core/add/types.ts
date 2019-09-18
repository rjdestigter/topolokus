import { Point, StateType, SharedState } from '../types'

export interface AddState extends SharedState {
    value: StateType.AddPolygon
    newPolygon: Point[]
}
