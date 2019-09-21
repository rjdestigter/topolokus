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
import { cancelKey$, enterKey$, ofKeyCode, makeFromEventType, keyPress$ } from '../observables'
import {
    AddEventTypes,
    addPointToNewPolygon,
    submitNewPolygon,
    cancelNewPolygon,
    SubmitNewPolygonEvent,
    addPolygon,
} from './events'
import { Point, Polygon, NoopState } from '../types'
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

const initial = <T>(xs: T[]) => {
    const clone = [...xs]
    clone.splice(xs.length - 1, 1)
    return clone
}

const tail = <T>(xs: T[]) => {
    const [_, ...t] = xs
    return t
}

const head = <T>(xs: T[]) => {
    const [h] = xs
    return h
}

const tuple = <A, B>(a: A, b: B): [A, B] => [a, b]

const first = <A>([a]: [A, any]): A => a
/**
 * Creates a program that will add a point to [[AddState]]'s `.newPolygon`
 * on every mosue click until the cancel or submit events are dispatched.
 */
export const makeAddPointToPolygon = <T>(
    nextPoint$: Observable<Point>,
    dispatch: (event: Event) => void,
) => {
    const undoKey$ = keyPress$
        .pipe(filter(evt => evt.ctrlKey && [122, 90, 26].includes(evt.keyCode)))
        .pipe(mapTo('undo' as const))

    const redoKey$ = keyPress$
        .pipe(filter(evt => evt.ctrlKey && [121, 89, 25].includes(evt.keyCode)))
        .pipe(mapTo('redo' as const))

    const allNewPoints$ = merge(nextPoint$, undoKey$, redoKey$).pipe(
        scan(
            ([currentPoints, redoPoints], event) =>
                // if
                Array.isArray(event)
                    ? // then
                      tuple([...currentPoints, event], [])
                    : // else if
                    event === 'undo' && currentPoints.length > 0
                    ? // then
                      tuple(initial(currentPoints), [
                          currentPoints[currentPoints.length - 1],
                          ...redoPoints,
                      ])
                    : // else if
                    event === 'redo' && redoPoints.length > 0
                    ? // then
                      tuple([...currentPoints, head(redoPoints)], tail(redoPoints))
                    : // else
                      tuple(currentPoints, []),
            tuple<Point[], Point[]>([], []),
        ),
        map(first),
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
                console.log('Event', event, ...points)
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
    nextPoint$: Observable<Point>,
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
        makeAddPointToPolygon(nextPoint$, dispatch),
        // Emit a final empty list of points once we are done.
        of([] as Point[]),
    ).pipe(
        tap(data => console.log(`Emit: ${data}`)),
        filter((data): data is Point[] => Array.isArray(data)),
    )

export default makeAddPolygonProgram
