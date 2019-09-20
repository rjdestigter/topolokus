import { State, NoopState, StateType, Point } from '../types'

import { AddState } from './types'
import { AddEventTypes } from './events'
import { Event } from '../events'

import isPolygon from '../utils/isPolygon'

/**
 * Transitions state to the beginning o the "Add polygon" process
 */
export const fromNoopToAddPolygon = <T>(state: NoopState): AddState => {
    return {
        value: StateType.AddPolygon,
    }
}

/**
 * Adds a point to the new poloygon the user is creating.
 */
export const addPointToNewPolygon = <T>(state: AddState, point: Point): AddState => {
    return {
        value: StateType.AddPolygon,
    }
}

/**
 * Transitions state to include the new polygon and return to base state.
 */
export const submitNewPolygon = <T>(state: AddState): NoopState => {
    return {
        value: StateType.Noop,
    }
}

/**
 * Transitions back to base state without a new polygon.
 */
export const cancelNewPolygon = <T>(state: AddState): NoopState => {
    return {
        value: StateType.Noop,
    }
}

/**
 * Handles incoming events and transitions state accordingly.
 */
export default <T>(state: State<T>, event: Event): State<T> => {
    // Transition to "AddPolygon" state
    if (event.type === AddEventTypes.AddPolygon && state.value === StateType.Noop) {
        return fromNoopToAddPolygon<T>(state)
    }

    // Add point to new polygon currently being drawn
    else if (
        event.type === AddEventTypes.AddPointToNewPolygon &&
        state.value === StateType.AddPolygon
    ) {
        return addPointToNewPolygon(state, event.payload)
    }

    // Finish drawing new polygon
    else if (
        event.type === AddEventTypes.SubmitNewPolygon &&
        state.value === StateType.AddPolygon
    ) {
        return submitNewPolygon(state)
    }

    // Cancel drawing a new polygon
    else if (
        event.type === AddEventTypes.CancelNewPolygon &&
        state.value === StateType.AddPolygon
    ) {
        return cancelNewPolygon(state)
    }

    return state
}
