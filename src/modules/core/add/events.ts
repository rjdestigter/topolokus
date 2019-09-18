import { Point } from '../types'

/**
 * Event type descriptors for the "Add Polygon" process
 */
export enum AddEventTypes {
    AddPolygon = 'AddPolygon',
    AddPointToNewPolygon = 'AddPointToNewPolygon',
    SubmitNewPolygon = 'SubmitNewPolygon',
    CancelNewPolygon = 'CancelNewPolygon',
}

/**
 * Event dispatched when the user wants to add a new polygon.
 */
export type AddPolygonEvent = {
    type: AddEventTypes.AddPolygon
}

/**
 * Event dispatched when the user clicks on the canvas to add a new point to the polygon they are creating.
 */
export type AddPointToNewPolygonEvent = {
    type: AddEventTypes.AddPointToNewPolygon
    payload: Point
}

/**
 * Event dispatched when the user has finished creating a new polygon.
 */
export type SubmitNewPolygonEvent = {
    type: AddEventTypes.SubmitNewPolygon
}

/**
 * Event dispatched when the user wants to cancel creating a new polygon.
 */
export type CancelNewPolygonEvent = {
    type: AddEventTypes.CancelNewPolygon
}

/**
 * All possible events for the "Add poloygon" process
 */
export type AddEvent =
    | AddPolygonEvent
    | AddPointToNewPolygonEvent
    | SubmitNewPolygonEvent
    | CancelNewPolygonEvent

/**
 * Event creator instructing the program the user wants to create a new polygon.
 */
export const addPolygon = (): AddPolygonEvent => ({ type: AddEventTypes.AddPolygon })

/**
 * Event creator instructing the program to add a new point to the new polygon.
 */
export const addPointToNewPolygon = (point: Point): AddPointToNewPolygonEvent => ({
    type: AddEventTypes.AddPointToNewPolygon,
    payload: point,
})

/**
 * Event creator instructing the program the user has finished creating a new polygon.
 */
export const submitNewPolygon = (): SubmitNewPolygonEvent => ({
    type: AddEventTypes.SubmitNewPolygon,
})

/**
 * Event creator instructing the program the user wants to cancel creating a new polygon.
 */
export const cancelNewPolygon = (): CancelNewPolygonEvent => ({
    type: AddEventTypes.CancelNewPolygon,
})
