import { Observable, concat, merge, of, race, combineLatest, Subject } from 'rxjs'
import {
    take,
    tap,
    filter,
    scan,
    mapTo,
    takeWhile,
    map,
    ignoreElements,
    withLatestFrom,
    last,
    mergeMap,
} from 'rxjs/operators'

import { cancelKey$, enterKey$, undoKey$, redoKey$ } from '../observables'
import { AddEventTypes, AddEvent } from './events'
import { Point, Snap, FromPoint, Shape } from '../types'
import { Event } from '../events'
import { initial, head, tail, first, tuple, second, isNotEmpty } from '../utils'
import { Pencil } from '../pencils'

import createPencil from './pencil'

/**
 * Creates a program for adding new polygons.
 */
export default <T>({
    pencil,
    from,
    shapes$,
    mouseMove$,
    mouseClick$,
    dispatchEvent,
    fromEventType,
    mouseCtx,
}: {
    pencil: Pencil
    mouseCtx: CanvasRenderingContext2D
    from: FromPoint
    shapes$: Observable<Shape<T>[]>
    mouseMove$: Observable<Snap>
    mouseClick$: Observable<Point>
    dispatchEvent: <E extends Event>($: Observable<E>) => Observable<Event>
    fromEventType: <E extends AddEvent['type']>(eventType: E) => Observable<E>
}) => {
    const addPencil = createPencil(pencil)(mouseCtx)

    const click$ = mouseClick$.pipe(
        map(point => ({
            type: 'click' as const,
            point,
        })),
    )
    const move$ = mouseMove$.pipe(
        map(point => ({
            type: 'move' as const,
            point,
        })),
    )

    const allNewPoints$ = merge(
        click$,
        move$,
        undoKey$.pipe(map(type => ({ type }))),
        redoKey$.pipe(map(type => ({ type }))),
        shapes$.pipe(mapTo({ type: 'shapes' as const })),
    ).pipe(
        scan(
            ([currentPoints, redoPoints], event) =>
                // if
                event.type === 'click'
                    ? // then
                      tuple([...currentPoints, event.point], [])
                    : // else if
                    event.type === 'undo' && currentPoints.length > 0
                    ? // then
                      tuple(initial(currentPoints), [
                          currentPoints[currentPoints.length - 1],
                          ...redoPoints,
                      ])
                    : // else if
                    event.type === 'redo' && isNotEmpty(redoPoints)
                    ? // then
                      tuple([...currentPoints, head(redoPoints)], tail(redoPoints))
                    : // else if
                    event.type === 'shapes'
                    ? // then
                      tuple(currentPoints.map(([, , lng, lat]) => from([lng, lat])), [])
                    : // else
                      tuple(currentPoints, []),
            tuple<Point[], Point[]>([], []),
        ),
        map(first),
    )

    const pressedEnter$ = enterKey$.pipe(
        mapTo({ type: AddEventTypes.SubmitNewPolygon as const }),
        dispatchEvent,
    )

    const pressedCancel$ = cancelKey$.pipe(
        mapTo({ type: AddEventTypes.CancelNewPolygon as const }),
        dispatchEvent,
    )

    const dispatchSubmitOrCancelOnKeyPress$ = merge(pressedCancel$, pressedEnter$).pipe(
        ignoreElements(),
    )

    const submit$ = fromEventType(AddEventTypes.SubmitNewPolygon).pipe(
        withLatestFrom(allNewPoints$),
        filter(stream => second(stream).length > 2),
        map(first),
    )

    const cancel$ = fromEventType(AddEventTypes.CancelNewPolygon)

    const submitOrCancel$ = race(submit$, cancel$).pipe(take(1))

    const points$ = merge(
        dispatchSubmitOrCancelOnKeyPress$,
        merge(submitOrCancel$, allNewPoints$),
    ).pipe(
        withLatestFrom(mouseMove$),
        tap(([stream, mousePosition]) => {
            Array.isArray(stream) && addPencil(mousePosition, stream)
        }),
        map(first),
        scan(
            (acc, next) => (Array.isArray(next) ? tuple(next, acc[1]) : tuple(acc[0], next)),
            tuple([] as Point[], AddEventTypes.AddPolygon) as [Point[], AddEventTypes],
        ),
        takeWhile(([, event]) => event === AddEventTypes.AddPolygon, true),
        last(),
        mergeMap(([points, outcome]) =>
            outcome === AddEventTypes.SubmitNewPolygon
                ? of({ type: AddEventTypes.SubmitNewPolygon as const, payload: points })
                : of(void 0).pipe(ignoreElements()),
        ),
    )

    return points$
}
