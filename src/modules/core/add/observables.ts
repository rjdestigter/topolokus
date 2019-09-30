import { Observable, concat, merge, of, combineLatest } from 'rxjs'
import { take, tap, filter, scan, mapTo, takeWhile, map } from 'rxjs/operators'

import { cancelKey$, enterKey$, ofKeyCode, undoKey$, redoKey$ } from '../observables'
import { AddEventTypes, submitNewPolygon, cancelNewPolygon, addPolygon } from './events'
import { Point } from '../types'
import { Event } from '../events'
import { isNotOfTypeNbr, initial, head, tail, first, tuple } from '../utils'

/**
 * Creates a program that will add a point to [[AddState]]'s `.newPolygon`
 * on every mosue click until the cancel or submit events are dispatched.
 */
export const makeAddPointToPolygon = <T>(
    nextPoint$: Observable<Point>,
    dispatch: (event: Event) => void,
) => {
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
export default <T>(nextPoint$: Observable<Point>): Observable<Point[]> =>
    concat(
        merge(
            concat(
                // Await pressing key "a" or "A"
                ofKeyCode([65, 97]).pipe(take(1)),
                // Dispatch "AddPolygon" event
                of(addPolygon()).pipe(tap(dispatch)),
            ).pipe(filter(isNotOfTypeNbr)),
        ).pipe(take(1)),
        makeAddPointToPolygon(nextPoint$, dispatch),
        // Emit a final empty list of points once we are done.
        of([] as Point[]),
    ).pipe(filter((data): data is Point[] => Array.isArray(data)))
