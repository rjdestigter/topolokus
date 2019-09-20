import { Observable, concat, merge, of, combineLatest } from 'rxjs'
import {
    take,
    tap,
    takeUntil,
    filter,
    switchMap,
    scan,
    switchMapTo,
    mapTo,
    startWith,
    takeWhile,
    map,
} from 'rxjs/operators'

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
import { Point, Polygon, NoopState, SharedState } from '../types'
import { Event } from '../events'
import isNotNr from '../utils/isNotNr'
import { noop } from '@babel/types'

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
 * Given an observable that streams state updates to [[AddState]] this function creates
 * an observable that will dispatch the SubmitNewPolygon event when the user presses
 * the entery key if the number of points in the polygon is larger than 2.
 */
/*
const makeSubmitNewPolygon$ = <T>(dispatch: Dispatch) =>
    concat(
        // Await state changes until the new polygon is enough points
        // to become a valid polygon.
        // TODO: When the user undoes adding points and reverts to 2 points
        addPolygonState$
            .pipe(
                filter(state => state.newPolygon.length > 2),
                take(1),
            )
            .pipe(
                switchMap(state =>
                    concat(
                        enterKey$.pipe(take(1)),
                        makeDispatchSubmitNewPolygon(
                            [...state.newPolygon, state.mousePosition],
                            dispatch,
                        ),
                    ),
                ),
            ),
    ).pipe(
        // Filter out the key presses and state changes so that this stream
        // ends up only emitting the SubmitNewPolygonEvent event.
        filter(isNotNr),
        filter(
            (value): value is SubmitNewPolygonEvent =>
                isNotNr(value) && value.hasOwnProperty('type'),
        ),
    )
*/

/** Observable for event of type CancelNewPolygon or SubmitNewPolygon */
/* const makeCancelOrSubmitEvent = <T>(
    addPolygonState$: Observable<SharedState<T> & AddState>,
    dispatch: Dispatch,
) => merge(makeSubmitNewPolygon$(dispatch), makeCancelNewPolygon(dispatch)) */

/**
 * Creates a program that will add a point to [[AddState]]'s `.newPolygon`
 * on every mosue click until the cancel or submit events are dispatched.
 */
export const makeAddPointToPolygon = <T>(
    newPoint$: Observable<Point>,
    dispatch: (event: Event) => void,
) => {
    const allNewPoints$ = newPoint$.pipe(
        scan((currentPoints, newPoint) => [...currentPoints, newPoint], [] as Point[]),
    )

    const pressedEnter$ = enterKey$.pipe(mapTo('submit' as const))
    const pressedCancel$ = cancelKey$.pipe(mapTo('cancel' as const))

    type Emitted = 'submit' | 'cancel' | Point[]
    type Accumulated = readonly [Emitted, Point[]]

    return merge(pressedEnter$, pressedCancel$, allNewPoints$)
        .pipe(
            scan(
                (acc, next) =>
                    // if
                    Array.isArray(next)
                        ? // then
                          ([next, next] as const)
                        : // else
                          ([next, acc[1]] as const),
                // Initial scan value
                [[], []] as Accumulated,
            ),
            takeWhile(
                ([data, points]) =>
                    // if
                    data === 'cancel'
                        ? // then
                          false
                        : // else if
                        data === 'submit' && points.length > 2
                        ? // then
                          false
                        : // else
                          true,
                // Inclusive takeWhile
                true,
            ),
        )
        .pipe(
            // filter(([submit, cancel]) => submit || cancel),
            tap(([event, points]) => {
                if (event === 'submit' && points.length > 2) {
                    dispatch(submitNewPolygon([points]))
                } else if (event === 'cancel') {
                    dispatch(cancelNewPolygon())
                }
            }),
            map(([, points]) => points),
        )
}

/**
 * Creates a program for adding new polygons.
 */
export const makeAddPolygonProgram = <T>(
    onMouseClick$: Observable<Point>,
    addPolygonEvent$: Observable<AddEventTypes.AddPolygon>,
    dispatch: (event: Event) => void,
): Observable<Point[]> =>
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
        makeAddPointToPolygon(onMouseClick$, dispatch),
        // Emit a final empty list of points once we are done.
        of([] as Point[]),
    ).pipe(
        tap(data => console.log(`Emit: ${data}`)),
        filter((data): data is Point[] => Array.isArray(data)),
    )

export default makeAddPolygonProgram
