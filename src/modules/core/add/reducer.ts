import { State, NoopState, StateType, Pixel, Polygon, Point } from '../types'

import { AddState } from './types'
import { AddEventTypes, AddEvent } from './events'
import { Event } from '../events'

import isPolygon from '../utils/isPolygon'

/**
 * Transitions state to the beginning o the "Add polygon" process
 */
export const fromNoopToAddPolygon = (state: NoopState): AddState => {
    return {
        ...state,
        value: StateType.AddPolygon,
        newPolygon: [],
    }
}

/**
 * Adds a point to the new poloygon the user is creating.
 */
export const addPointToNewPolygon = (state: AddState, point: Point): AddState => {
    return {
        ...state,
        value: StateType.AddPolygon,
        newPolygon: [...state.newPolygon, point],
    }
}

/**
 * Transitions state to include the new polygon and return to base state.
 */
export const submitNewPolygon = (state: AddState, polygon: Polygon): NoopState => {
    return {
        ...state,
        value: StateType.Noop,
        polygons: [...state.polygons, polygon],
    }
}

/**
 * Transitions back to base state without a new polygon.
 */
export const cancelNewPolygon = (state: AddState): NoopState => {
    return {
        ...state,
        value: StateType.Noop,
    }
}

/**
 * Handles incoming events and transitions state accordingly.
 */
export default (state: State, event: Event): State => {
    // Transition to "AddPolygon" state
    if (event.type === AddEventTypes.AddPolygon && state.value === StateType.Noop) {
        return fromNoopToAddPolygon(state)
    }

    // Add point to new polygon currently being drawn
    else if (
        event.type === AddEventTypes.AddPointToNewPolygon &&
        state.value == StateType.AddPolygon
    ) {
        return addPointToNewPolygon(state, event.payload)
    }

    // Finish drawing new polygon
    else if (
        event.type === AddEventTypes.SubmitNewPolygon &&
        state.value == StateType.AddPolygon &&
        isPolygon(state.newPolygon)
    ) {
        return submitNewPolygon(state, state.newPolygon)
    }

    // Cancel drawing a new polygon
    else if (event.type === AddEventTypes.CancelNewPolygon && state.value == StateType.AddPolygon) {
        return cancelNewPolygon(state)
    }

    return state
}
