import { Actions, ActionTypes, LocisState, QPosition } from './types'

// Local Constants, Functions, Objects
export const initialState: LocisState = {
    lastKnownMousePosition: [0, 0],
    pointsInProgress: [],
    drawing: false,
    geoJSON: [],
    points: [],
    lines: [],
    lineSnap: true,
    pointSnap: true,
    selectedIndex: undefined,
    selectedPoint: undefined,
}

export const reducer = (state = initialState, action: Actions): LocisState => {
    if (action.type === ActionTypes.LOAD) {
        return {
            ...state,
            geoJSON: action.payload.polyItems,
            lines: action.payload.lines,
            points: action.payload.coordinates,
            pointsInProgress: action.payload.pointsInProgress,
        }
    } else if (action.type === ActionTypes.UPDATE_MOUSE_POSITION) {
        return {
            ...state,
            lastKnownMousePosition: action.payload,
        }
    } else if (action.type === ActionTypes.ADD) {
        return {
            ...state,
            pointsInProgress: [],
            drawing: false,
            geoJSON: state.geoJSON.concat(action.payload),
        }
    } else if (action.type === ActionTypes.ADD_POINT_IN_PROGRESS) {
        const payload = [...action.payload] as QPosition
        return {
            ...state,
            points: [...state.points, action.payload],
            pointsInProgress: [...state.pointsInProgress, payload],
        }
    } else if (action.type === ActionTypes.SELECT) {
        return {
            ...state,
            selectedIndex: action.payload,
        }
    } else if (action.type === ActionTypes.SELECT_POINT) {
        return {
            ...state,
            selectedPoint: action.payload ? ([...action.payload] as QPosition) : undefined,
        }
    } else if (action.type === ActionTypes.DRAW_POLYGON) {
        return {
            ...state,
            drawing: true,
            pointsInProgress: [],
            selectedPoint: undefined,
            selectedIndex: undefined,
        }
    }

    return state
}
