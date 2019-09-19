import { Observable, concat, merge, of } from 'rxjs'
import { take, tap, takeUntil, filter } from 'rxjs/operators'

import { AddState } from './types'
import { cancelKey$, enterKey$, ofKeyCode, makeFromEventType } from '../observables'
import {
    AddEventTypes,
    addPointToNewPolygon,
    submitNewPolygon,
    cancelNewPolygon,
    SubmitNewPolygonEvent,
    addPolygon,
} from './events'
import { Point } from '../types'
import { Event } from '../events'
import isNotNr from '../utils/isNotNr'

/** Type describing the function that passes an event to the events$ [[Subject]] */
type Dispatch = (event: Event) => void

/** Observable for event of type  AddPolygon */
export const makeAddPolygonEvent$ = (fromEventType: ReturnType<typeof makeFromEventType>) =>
    fromEventType(AddEventTypes.AddPolygon)

/** Observable for event of type  AddPointToNewPolygon */
export const makeAddPointToNewPolygonEvent$ = (
    fromEventType: ReturnType<typeof makeFromEventType>,
) => fromEventType(AddEventTypes.AddPointToNewPolygon)

/** Observable for event of type  SubmitNewPolygon */
export const makeSubmitNewPolygonEvent$ = (fromEventType: ReturnType<typeof makeFromEventType>) =>
    fromEventType(AddEventTypes.SubmitNewPolygon)

/** Observable for event of type  CancelNewPolygon */
export const makeCancelNewPolygonEvent$ = (fromEventType: ReturnType<typeof makeFromEventType>) =>
    fromEventType(AddEventTypes.CancelNewPolygon)

/**
 * Creates an observable of a single dispatch SubmitNewPolygon event.
 */
const makeDispatchSubmitNewPolygon = (dispatch: Dispatch) =>
    of(submitNewPolygon()).pipe(tap(action => dispatch(action)))

/**
 * Creates an observable of a single dispatch CancelNewPolygon event.
 */
const makeDispatchCancelNewPolygon = (dispatch: Dispatch) =>
    of(cancelNewPolygon()).pipe(tap(action => dispatch(action)))

/**
 * Creates an observable that will dispatch the CancelNewPolygon event when
 * the user pressed the key (c) to cancel the "Add poloygon" operation.
 */
const makeCancelNewPolygon = (addPolygonState$: Observable<AddState>, dispatch: Dispatch) =>
    concat(cancelKey$.pipe(take(1)), makeDispatchCancelNewPolygon(dispatch)).pipe(
        // Filter out the key presses and only emit the CancelNewPolygonEvent event.
        filter(isNotNr),
    )

/**
 * Given an observable that streams state updates to [[AddState]] this function creates
 * an observable that will dispatch the SubmitNewPolygon event when the user presses
 * the entery key if the number of points in the polygon is larger than 2.
 */
const makeSubmitNewPolygon$ = (addPolygonState$: Observable<AddState>, dispatch: Dispatch) =>
    concat(
        // Await state changes until the new polygon is enough points
        // to become a valid polygon.
        // TODO: When the user undoes adding points and reverts to 2 points
        addPolygonState$.pipe(
            filter(state => state.newPolygon.length > 2),
            take(1),
        ),
        enterKey$.pipe(take(1)),
        makeDispatchSubmitNewPolygon(dispatch),
    ).pipe(
        // Filter out the key presses and state changes so that this stream
        // ends up only emitting the SubmitNewPolygonEvent event.
        filter(isNotNr),
        filter(
            (value): value is SubmitNewPolygonEvent =>
                isNotNr(value) && value.hasOwnProperty('type'),
        ),
    )

/** Observable for event of type CancelNewPolygon or SubmitNewPolygon */
const cancelOrSubmitEvent$ = (addPolygonState$: Observable<AddState>, dispatch: Dispatch) =>
    merge(
        makeSubmitNewPolygon$(addPolygonState$, dispatch),
        makeCancelNewPolygon(addPolygonState$, dispatch),
    )

/**
 * Creates a program that will add a point to [[AddState]]'s `.newPolygon`
 * on every mosue click until the cancel or submit events are dispatched.
 */
export const makeAddPointToPolygon = (
    onMouseClick$: Observable<Point>,
    addPolygonState$: Observable<AddState>,
    dispatch: (event: Event) => void,
) =>
    onMouseClick$.pipe(
        tap(point => dispatch(addPointToNewPolygon(point))),
        takeUntil(cancelOrSubmitEvent$(addPolygonState$, dispatch)),
    )

/**
 * Creates a program for adding new polygons.
 */
export const makeAddPolygonProgram = (
    onMouseClick$: Observable<Point>,
    addPolygonState$: Observable<AddState>,
    addPolygonEvent$: Observable<AddEventTypes.AddPolygon>,
    dispatch: (event: Event) => void,
) =>
    concat(
        merge(
            concat(
                // Await pressing key "a" or "A"
                ofKeyCode([65, 97]).pipe(take(1)),
                // Dispatch "AddPolygon" event
                of(addPolygon()).pipe(tap(dispatch)),
            ).pipe(filter(isNotNr)),
            addPolygonEvent$,
        ).pipe(take(1)),
        makeAddPointToPolygon(onMouseClick$, addPolygonState$, dispatch),
    )

export default makeAddPolygonProgram
