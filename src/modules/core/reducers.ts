import {
    State,
    AddPolygonState,
    NoopState,
    StateType,
    Action,
    ActionTypes,
    Pixel,
    Polygon,
} from './types'

import isPolygon from './utils/isPolygon'

export const fromNoopToAddPolygon = (state: NoopState): AddPolygonState => {
    return {
        ...state,
        type: StateType.AddPolygon,
        newPolygon: [],
    }
}

export const addPointToNewPolygon = (
    state: AddPolygonState,
    point: [Pixel, Pixel],
): AddPolygonState => {
    return {
        ...state,
        type: StateType.AddPolygon,
        newPolygon: [...state.newPolygon, point],
    }
}

export const submitNewPolygon = (state: AddPolygonState, polygon: Polygon): NoopState => {
    return {
        ...state,
        type: StateType.Noop,
        polygons: [...state.polygons, polygon],
    }
}

export const cancelNewPolygon = (state: AddPolygonState): NoopState => {
    return {
        ...state,
        type: StateType.Noop,
    }
}

export const transition = (state: State, action: Action): State => {
    // Transition to "AddPolygon" state
    if (action.type === ActionTypes.AddPolygon && state.type === StateType.Noop) {
        return fromNoopToAddPolygon(state)

        // Add point to new polygon currently being drawn
    } else if (
        action.type === ActionTypes.AddPointToNewPolygon &&
        state.type == StateType.AddPolygon
    ) {
        return addPointToNewPolygon(state, action.payload)
    }

    // Finish drawing new polygon
    else if (
        action.type === ActionTypes.SubmitNewPolygon &&
        state.type == StateType.AddPolygon &&
        isPolygon(state.newPolygon)
    ) {
        return submitNewPolygon(state, state.newPolygon)
    }

    // Cancel drawing a new polygon
    else if (action.type === ActionTypes.CancelNewPolygon && state.type == StateType.AddPolygon) {
        return cancelNewPolygon(state)
    }

    return state
}
