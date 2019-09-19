import { State, NoopState, StateType, Point, SharedState } from '../types'

import { AddState } from './types'
import { AddEventTypes } from './events'
import { Event } from '../events'

import isPolygon from '../utils/isPolygon'

/**
 * Transitions state to the beginning o the "Add polygon" process
 */
export const fromNoopToAddPolygon = <T>(
    state: SharedState<T> & NoopState,
): SharedState<T> & AddState => {
    return {
        ...state,
        value: StateType.AddPolygon,
        newPolygon: [],
    }
}

/**
 * Adds a point to the new poloygon the user is creating.
 */
export const addPointToNewPolygon = <T>(
    state: SharedState<T> & AddState,
    point: Point,
): SharedState<T> & AddState => {
    return {
        ...state,
        value: StateType.AddPolygon,
        newPolygon: [...state.newPolygon, point],
    }
}

/**
 * Transitions state to include the new polygon and return to base state.
 */
export const submitNewPolygon = <T>(
    state: SharedState<T> & AddState,
    // polygon: Polygon,
): SharedState<T> & NoopState => {
    return {
        ...state,
        value: StateType.Noop,
        // polygons: [...state.polygons, polygon],
    }
}

/**
 * Transitions back to base state without a new polygon.
 */
export const cancelNewPolygon = <T>(
    state: SharedState<T> & AddState,
): SharedState<T> & NoopState => {
    return {
        ...state,
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
        state.value === StateType.AddPolygon &&
        isPolygon(state.newPolygon)
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
