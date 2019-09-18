import { Observable, concat, merge, of } from 'rxjs'
import { take, tap, takeUntil, filter, map } from 'rxjs/operators'

import { AddState } from './types'
import { fromEventType, cancelKey$, enterKey$ } from '../observables'
import {
    AddEventTypes,
    addPointToNewPolygon,
    submitNewPolygon,
    cancelNewPolygon,
    CancelNewPolygonEvent,
    SubmitNewPolygonEvent,
} from './events'
import { Point } from '../types'
import { Event } from '../events'
import isNotNr from '../utils/isNotNr'
import is from '../utils/is'
import getterOf from '../utils/getterOf'

/** Type describing the function that passes an event to the events$ [[Subject]] */
type Dispatch = (event: Event) => void

/** Observable for event of type  AddPolygon */
export const addPolygonEvent$ = fromEventType(AddEventTypes.AddPolygon)

/** Observable for event of type  AddPointToNewPolygon */
export const addPointToNewPolygonEvent$ = fromEventType(AddEventTypes.AddPointToNewPolygon)

/** Observable for event of type  SubmitNewPolygon */
export const submitNewPolygonEvent$ = fromEventType(AddEventTypes.SubmitNewPolygon)

/** Observable for event of type  CancelNewPolygon */
export const cancelNewPolygonEvent$ = fromEventType(AddEventTypes.CancelNewPolygon)

/**
 *
 * @param dispatch
 */
const makeDispatchSubmitNewPolygon = (dispatch: Dispatch) =>
    of(submitNewPolygon()).pipe(tap(action => dispatch(action)))

/**
 *
 * @param dispatch
 */
const makeDispatchCancelNewPolygon = (dispatch: Dispatch) =>
    of(cancelNewPolygon()).pipe(tap(action => dispatch(action)))

/**
 *
 * @param dispatch
 */
const makeCancelNewPolygon = (addPolygonState$: Observable<AddState>, dispatch: Dispatch) =>
    concat(
        addPolygonState$.pipe(take(1)),
        cancelKey$.pipe(take(1)),
        makeDispatchCancelNewPolygon(dispatch),
    ).pipe(
        filter(isNotNr),
        filter((value): value is CancelNewPolygonEvent => value.hasOwnProperty('type')),
        map(getterOf('type')),
        filter(is(AddEventTypes.CancelNewPolygon)),
    )

/**
 *
 * @param dispatch
 */
const makeSubmitNewPolygon$ = (addPolygonState$: Observable<AddState>, dispatch: Dispatch) =>
    concat(
        addPolygonState$.pipe(
            filter(state => state.newPolygon.length > 2),
            take(1),
        ),
        enterKey$.pipe(take(1)),
        makeDispatchSubmitNewPolygon(dispatch),
    ).pipe(
        filter(isNotNr),
        filter((value): value is SubmitNewPolygonEvent => value.hasOwnProperty('type')),
        map(getterOf('type')),
        filter(is(AddEventTypes.SubmitNewPolygon)),
    )

/** Observable for event of type CancelNewPolygon or SubmitNewPolygon */
const cancelOrSubmitEvent$ = (addPolygonState$: Observable<AddState>, dispatch: Dispatch) =>
    merge(
        makeSubmitNewPolygon$(addPolygonState$, dispatch),
        makeCancelNewPolygon(addPolygonState$, dispatch),
    )

/**
 *
 * @param onMouseClick$
 * @param dispatch
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
 *
 * @param onMouseClick$
 * @param dispatch
 */
export const makeAddPolygonProgram = (
    onMouseClick$: Observable<Point>,
    addPolygonState$: Observable<AddState>,
    dispatch: (event: Event) => void,
) =>
    concat(
        addPolygonEvent$.pipe(take(1)),
        makeAddPointToPolygon(onMouseClick$, addPolygonState$, dispatch),
    )

export default makeAddPolygonProgram
