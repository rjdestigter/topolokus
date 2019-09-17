import {
    ActionTypes,
    Pixel,
    Polygon,
    CancelNewPolygonAction,
    SubmitNewPolygonAction,
    AddPointToNewPolygonAction,
    AddPolygonAction,
} from './types'

export const addPolygon = (): AddPolygonAction => ({ type: ActionTypes.AddPolygon })

export const addPointToNewPolygon = (point: [Pixel, Pixel]): AddPointToNewPolygonAction => ({
    type: ActionTypes.AddPointToNewPolygon,
    payload: point,
})

export const submitNewPolygon = (): SubmitNewPolygonAction => ({
    type: ActionTypes.SubmitNewPolygon,
})

export const cancelNewPolygon = (): CancelNewPolygonAction => ({
    type: ActionTypes.CancelNewPolygon,
})
