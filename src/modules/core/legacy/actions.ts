import {
    ActionTypes,
    AddAction,
    AddPointInProgressAction,
    DrawPolygonAction,
    LoadAction,
    NoopAction,
    PolyItem,
    QPosition,
    SelectAction,
    SelectPointAction,
    UpdateMousePositionAction,
} from './types'

const load = (payload: LoadAction['payload']): LoadAction => {
    return {
        type: ActionTypes.LOAD,
        payload,
    }
}

const drawPolygon = (): DrawPolygonAction => {
    return {
        type: ActionTypes.DRAW_POLYGON,
        payload: undefined,
    }
}

const updateMousePosition = (payload: [number, number]): UpdateMousePositionAction => {
    return {
        type: ActionTypes.UPDATE_MOUSE_POSITION,
        payload,
    }
}

const add = (payload: PolyItem | PolyItem[]): AddAction => {
    return {
        type: ActionTypes.ADD,
        payload,
    }
}

const addPointInProgress = (payload: QPosition): AddPointInProgressAction => {
    return {
        type: ActionTypes.ADD_POINT_IN_PROGRESS,
        payload,
    }
}

const select = (payload: SelectAction['payload']): SelectAction => {
    return {
        type: ActionTypes.SELECT,
        payload,
    }
}

const selectPoint = (payload: SelectPointAction['payload']): SelectPointAction => {
    return {
        type: ActionTypes.SELECT_POINT,
        payload,
    }
}

export const actionCreators = {
    load,
    drawPolygon,
    updateMousePosition,
    add,
    addPointInProgress,
    select,
    selectPoint,
}

const noop: NoopAction = { type: ActionTypes.NOOP }

export const actions = {
    noop,
    drawPolygon: drawPolygon(),
}
