import {
    fromEvent,
    merge,
    Subject,
    Observable,
    of,
    combineLatest,
    observable,
    BehaviorSubject,
    concat,
    race,
    empty,
} from 'rxjs'
import {
    map,
    tap,
    repeat,
    filter,
    scan,
    mapTo,
    switchMap,
    startWith,
    switchMapTo,
    mergeMap,
    withLatestFrom,
    share,
    ignoreElements,
    last,
    takeUntil,
    endWith,
    take,
    mergeMapTo,
    mergeAll,
    delay,
    publishBehavior,
    refCount,
    publishReplay,
    shareReplay,
} from 'rxjs/operators'

import KDBush from 'kdbush'
import createPolyBush from './rbush'

// @ts-ignore
import nearestPointOnLine from '@turf/nearest-point-on-line'

import { StateType, State, Point, Shape, ShapeTypes, ConvertPoint, Snap, SnapType } from './types'
import { mapMouseEventToOffset, second, first } from './utils'
import createPencil from './pencils'
import { Event } from './events'
import { mapFirst, ofKeyCode, makeFromEventType, mapObservableToPropType } from './observables'
import {
    convertShapesToListOfPoints,
    filterPolygonShapes,
    convertPolygonShapesToListOfLines,
    convertShapesToListOfLines,
    convertListOfLinesToLineString,
} from './selectors'

import { AddState } from './add/types'
import { addPolygon, AddEventTypes, SubmitNewPolygonEvent } from './add/events'
import makeAddPolygonProgram from './add/observables'
import { isPolygonShape, warn } from './utils'
import { toMulticast } from './legacy/observables'
import { findLineSnapPosition } from './legacy/utils'

ofKeyCode([120, 88]).subscribe(() => console.clear())

export default <T>(convert: ConvertPoint, shapes$: Observable<Shape<T>[]>) => (
    canvas: HTMLCanvasElement,
    mouseCanvas: HTMLCanvasElement,
    config: {
        mapOffset?: (xy: [number, number]) => [number, number]
    } = {},
) => {
    const ctx = canvas.getContext('2d')
    const mouseCtx = mouseCanvas.getContext('2d')
    const pencil = createPencil()(canvas)
    const mousePencil = createPencil()(mouseCanvas)

    /**
     *
     * @param param0
     */
    const toPoint = ([x, y]: [number, number]): Point => {
        const [lng, lat] = convert.to([x, y])
        return [x, y, lng, lat]
    }

    if (mousePencil && pencil && ctx != null && mouseCtx != null) {
        canvas.style.cursor = 'none'
        mouseCanvas.style.cursor = 'none'

        /**
         * Final API for drawing markers, polygons, and lines.
         */

        /**
         * K-2 tree used to store all points that are present within
         * the system and used to find points that are near the mouse
         * position to snap to.
         */
        const pointsDb$ = new BehaviorSubject(
            // @ts-ignore
            new KDBush([]) as KDBush.KDBush<Point>,
        )

        const polyDb$ = new BehaviorSubject(createPolyBush())

        const lineDb$ = new BehaviorSubject([] as [Point, Point][])

        /**
         * Observable for emitting events
         */
        const events$ = new Subject<Event>()

        /**
         * Observable emits all event types that are dispatched
         */
        const eventTypes$ = mapObservableToPropType(events$.asObservable())

        /**
         * Creates an observable that filters events by type
         */
        const fromEventType = makeFromEventType(eventTypes$)

        /**
         * Dispatches events
         */
        const dispatch = (event: Event) => {
            events$.next(event)
        }

        const dispatchEvent = <E extends Event>($: Observable<E>) => $.pipe(tap(dispatch))
        /**
         * Observable streaming current and previous state
         */
        // const stateUpdates$ = new Subject<[State<T>, State<T>]>()

        /**
         * Maps state changes to actual state
         */
        // const state$ = stateUpdates$.pipe(mapFirst)

        /**
         * Finds the nearest point a given point can snap to
         */

        const mapPointToSnapFn$ = combineLatest(
            shapes$.pipe(startWith([])),
            pointsDb$,
            lineDb$,
        ).pipe(
            map(([shapes, pointsDb, lineDb]) => {
                return ([x, y, lng, lat]: Point): Snap => {
                    const pointSnap = convertShapesToListOfPoints(shapes)[
                        pointsDb.within(x, y, 10)[0]
                    ]

                    if (pointSnap) {
                        return { type: SnapType.Point, point: pointSnap }
                    }

                    const lineSnap = findLineSnapPosition([x, y, lng!, lat!], lineDb as any)

                    if (lineSnap) {
                        const multiLineString = convertListOfLinesToLineString(lineDb)
                        const maybePoint = nearestPointOnLine(multiLineString, [lng, lat])

                        if (maybePoint) {
                            const [sx, sy] = convert.from(maybePoint.geometry.coordinates)
                            return {
                                distance: 4,
                                line: (lineSnap.line as any) as [Point, Point],
                                type: SnapType.Line,
                                point: [sx, sy, ...maybePoint.geometry.coordinates] as any, // [lineSnap.point[0], lineSnap.point[1], lng, lat] as Point,
                            }
                        }
                    }

                    return { type: SnapType.None, point: [x, y, lng, lat] as Point }
                }
            }),
            shareReplay(1),
        )

        /**
         *
         */
        const updatePointsDb$ = shapes$.pipe(
            withLatestFrom(polyDb$),
            tap(([shapes, polyDb]) => {
                const polygons = filterPolygonShapes(shapes).map(item => item.shape)
                lineDb$.next(convertShapesToListOfLines(shapes))
                polyDb.replace(polygons)
            }),
            mapFirst,
            map(convertShapesToListOfPoints),
            tap(points => {
                pointsDb$.next(
                    // @ts-ignore
                    new KDBush(points),
                )
            }),
        )

        const mouseClick$ = fromEvent<MouseEvent>(mouseCanvas, 'click')
        const mouseClickOffset$ = mouseClick$.pipe(map(e => mapMouseEventToOffset(e)))

        const translatedMouseClick$ = config.mapOffset
            ? mouseClickOffset$.pipe(map(config.mapOffset))
            : mouseClickOffset$

        // const snappedClick$ = translatedMouseClick$.pipe(
        //     withLatestFrom(mapPointToSnapFn$),
        //     map(([point, mapPointToSnap]) => mapPointToSnap(point)),
        // )

        const mouseMove$ = fromEvent<MouseEvent>(mouseCanvas, 'mousemove')
        const mouseMoveOffset$ = mouseMove$.pipe(map(e => mapMouseEventToOffset(e)))
        const translatedMousemMove$ = config.mapOffset
            ? mouseMoveOffset$.pipe(map(config.mapOffset))
            : mouseMoveOffset$.pipe()

        const mousePositionSnapped$ = translatedMousemMove$.pipe(
            map(point => {
                const [px, py] = point
                const [lng, lat] = convert.to(point)

                return [px, py, lng, lat] as Point
            }),
            withLatestFrom(mapPointToSnapFn$),
            map(([point, mapPointToSnap]) => mapPointToSnap(point)),
            // shareReplay(1),
            // publishBehavior({ type: 'M', point: [0, 0, 0, 0] } as Snap),
            // refCount(),
            // share(),
            // shareReplay(1),
            shareReplay(1),
        )
        // .pipe(shareReplay(1))

        // const mousePositionSnappedPoint$ = mousePositionSnapped$.pipe(map(({ point }) => point))

        const hoverIndex$ = translatedMousemMove$.pipe(
            map(toPoint),
            withLatestFrom(polyDb$),
            map(([point, polyDb]) => polyDb.searchPoint(point).map(item => item.index)),
            scan((acc, next) => [acc[1], next] as const, [[], []] as readonly [number[], number[]]),
            filter(([a, b]) => a.length !== b.length || a.some((n, index) => n !== b[index])),
            map(([, b]) => b),
        )

        const add$ = makeAddPolygonProgram({
            pencil: mousePencil,
            mouseCtx,
            from: convert.from,
            shapes$,
            mouseMove$: mousePositionSnapped$,
            mouseClick$: mouseClick$.pipe(
                withLatestFrom(mousePositionSnapped$),
                map(second),
                map(snap => snap.point),
            ),
            dispatchEvent,
            fromEventType,
        })

        const draw$ = combineLatest(
            shapes$.pipe(startWith([] as Shape<T>[])),
            hoverIndex$.pipe(startWith([] as number[])),
        ).pipe(
            tap(data => {
                const [shapes, hoverIndices] = data

                pencil.resetStyles()

                // Clear the canvas
                pencil.eraser()

                // Draw existing polygons
                const polygons = filterPolygonShapes(shapes)
                polygons.forEach((shape, index) => {
                    const hovering = hoverIndices.includes(index)
                    pencil.polygon({ ...shape, meta: { hovering, id: shape.meta } })
                    pencil.resetStyles()
                })
            }),
        )

        const clear$ = mousePositionSnapped$.pipe(
            tap(snap => {
                mousePencil.eraser()
                mousePencil.cursor(snap)
            }),
            ignoreElements(),
        )

        const addShortCutKey$ = ofKeyCode([65, 97]).pipe(
            mapTo({ type: AddEventTypes.AddPolygon }),
            dispatchEvent,
            ignoreElements(),
        )

        const noop$ = of({ type: 'Noop' as const }).pipe(
            dispatchEvent,
            ignoreElements(),
        )

        const core$ = merge(
            addShortCutKey$,
            of(void 0),
            fromEventType('Noop'),
            fromEventType(AddEventTypes.AddPolygon),
        ).pipe(
            warn,
            switchMap(event => {
                switch (event) {
                    case AddEventTypes.AddPolygon: {
                        return concat(add$, noop$)
                    }
                    default: {
                        return clear$
                    }
                }
            }),
            // share(),
        )

        const plop$ = merge(
            merge(updatePointsDb$, draw$ /* drawNewPolygon$, */).pipe(ignoreElements()),
            core$,
            // cursor$,
        ).pipe(share())

        // const subscription = plop$.subscribe()

        return {
            done: () => {
                // subscription.unsubscribe()
            },
            subscribe: ((...args: any[]) => plop$.subscribe(...args)) as typeof plop$.subscribe,
            api: {
                add: () => dispatch(addPolygon()),
            },
        }
    }

    throw new Error('Canvas 2D Rendering Context Not Available')
}
