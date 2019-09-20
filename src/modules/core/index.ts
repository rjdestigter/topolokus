import { fromEvent, merge, Subject, Observable, of, combineLatest } from 'rxjs'
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
} from 'rxjs/operators'

import KDBush from 'kdbush'
import createPolyBush from './rbush'

import { StateType, State, Point, Shape, SharedState, ShapeTypes } from './types'
import mapMouseEventToCoords from './utils/mapMouseEventToCoords'
import pencil_ from './pencils'
import { Event } from './events'
import transition from './reducers'
import { mapFirst, ofKeyCode, makeFromEventType, makeEventTypes } from './observables'
import { convertShapesToListOfPoints, filterPolygonShapes } from './selectors'

import { AddState } from './add/types'
import { addPolygon, AddEventTypes, SubmitNewPolygonEvent } from './add/events'
import makeAddPolygonProgram from './add/observables'
import { isPolygonShape } from './utils'
import { toMulticast } from './legacy/observables'

// let cycle = 1
// let mousemoveIndex = 0

export default <T>(shapes$: Observable<Shape<T>[]>) => (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')

    // console.group(`Cycle ${cycle}`)

    if (ctx != null) {
        /**
         * Final API for drawing markers, polygons, and lines.
         */
        const pencil = pencil_()(ctx)

        /**
         * K-2 tree used to store all points that are present within
         * the system and used to find points that are near the mouse
         * position to snap to.
         */
        let pointsDb: KDBush.KDBush<Point> =
            // @ts-ignore
            new KDBush([])

        const polyDb = createPolyBush()

        /**
         * Observable for emitting events
         */
        const events$ = new Subject<Event>()

        /**
         * Observable emits all event types that are dispatched
         */
        const eventTypes$ = makeEventTypes(events$)

        /**
         * Creates an observable that filters events by type
         */
        const fromEventType = makeFromEventType(eventTypes$)

        /**
         * Dispatches events
         */
        const dispatch = (event: Event) => events$.next(event)

        /**
         * Observable streaming current and previous state
         */
        const stateUpdates$ = new Subject<[State<T>, State<T>]>()

        /**
         * Filters state updates by checking if state has actually changed
         */
        const stateChanges$ = stateUpdates$.pipe(filter(([c, p]) => c !== p))

        /**
         * Maps state changes to actual state
         */
        const state$ = stateUpdates$.pipe(mapFirst)

        /**
         * Finds the nearest point a given point can snap to
         */
        const mapPointToSnap = ([x, y]: [number, number]): Point => {
            const pointSnap = convertShapesToListOfPoints(shapesState)[pointsDb.within(x, y, 10)[0]]
            pointSnap && console.log(...pointSnap)
            return pointSnap || [x, y]
        }

        /**
         *
         */
        const updatePointsDb$ = shapes$.pipe(
            tap(shapes => {
                const polygons = filterPolygonShapes(shapes).map(item => item.shape)
                polyDb.replace(polygons)
            }),
            map(convertShapesToListOfPoints),
            tap(points => {
                console.log(`Recreating KdTree with     ${points.length} points.`)
                // @ts-ignore
                pointsDb = new KDBush(points)
            }),
        )

        let state: State<T> = {
            mousePosition: [0, 0],
            value: StateType.Noop,
            hovering: false,
            // hoverIndex: -1,
            selectedIndices: [],
        }

        let shapesState: Shape<T>[] = []
        shapes$.subscribe(shapes => (shapesState = shapes))

        const history: State<T>[] = []
        let future: State<T>[] = []

        const setState = (nextState: State<T>, affectsHistory = true) => {
            // console.time('setState')
            const prev = state

            if (affectsHistory) {
                history.push(state)
                future = []
            }

            state = nextState
            stateUpdates$.next([state, prev])
            // console.timeEnd('setState')
        }

        const undo = () => {
            const prev = history.pop()

            if (prev) {
                future.push(state)
                setState(
                    {
                        ...prev,
                        mousePosition: state.mousePosition,
                    },
                    false,
                )
            }
        }

        const redo = () => {
            const next = future.pop()

            if (next) {
                history.push(next)
                setState(
                    {
                        ...next,
                        mousePosition: state.mousePosition,
                    },
                    false,
                )
            }
        }

        const onMouseClick$ = fromEvent<MouseEvent>(canvas, 'click').pipe(
            map(e => mapMouseEventToCoords(e)),
        )

        const onMouseDown$ = fromEvent<MouseEvent>(canvas, 'mousedown')

        const onMouseUp = fromEvent<MouseEvent>(canvas, 'mouseup')

        const onMouseMove$ = fromEvent<MouseEvent>(canvas, 'mousemove').pipe(
            // tap(() => console.time(`mousemove:${mousemoveIndex}`)),
            map(e => mapMouseEventToCoords(e)),
        )

        const mousePosition$ = state$.pipe(map(state => state.mousePosition))

        const onMouseClickTranslated$ = onMouseClick$.pipe(
            map(([x, y]) => {
                const [tx = 0, ty = 0] = (
                    canvas.style.transform.match(
                        /translate3d\((-?\d+)px[, ]+(-?\d+)px[, ]+(-?\d+)/,
                    ) || []
                )
                    .map(str => +str)
                    .filter(n => !isNaN(n))

                return [x + tx, y + ty] as [number, number]
            }),
        )

        const onMouseMoveTranslated$ = onMouseMove$.pipe(
            map(([x, y]) => {
                const [tx = 0, ty = 0] = (
                    canvas.style.transform.match(
                        /translate3d\((-?\d+)px[, ]+(-?\d+)px[, ]+(-?\d+)/,
                    ) || []
                )
                    .map(str => +str)
                    .filter(n => !isNaN(n))

                return [x + tx, y + ty] as [number, number]
            }),
        )

        const hoverIndex$ = toMulticast(
            mousePosition$.pipe(
                // tap(() => console.time('hoverIndex')),
                map(point => polyDb.searchPoint(point).map(item => item.index)),
                scan((acc, next) => [acc[1], next] as const, [[], []] as readonly [
                    number[],
                    number[],
                ]),
                // tap(() => console.timeEnd('hoverIndex')),
                // tap(n => console.log(n)),
                filter(([a, b]) => a.length !== b.length || a.some((n, index) => n !== b[index])),
                map(([, b]) => b),
            ),
        )

        const value$ = state$.pipe(map(state => state.value))

        const hoverIndexNoop$ = value$.pipe(
            switchMap(value => (value === StateType.Noop ? hoverIndex$ : of([] as number[]))),
        )

        const updateStateWithMousePosition$ = onMouseMoveTranslated$.pipe(
            map(mapPointToSnap),
            tap(mousePosition => {
                setState(
                    {
                        ...state,
                        mousePosition: mousePosition as [number, number],
                    },
                    false,
                )
            }),
        )

        // const logStateChange$ = stateUpdates$.pipe(tap(console.log))

        const reduceActions$ = events$.pipe(
            tap(event => {
                const nextState = transition(state, event)
                console.groupCollapsed(event.type)
                console.log(event)
                console.log(state)
                console.groupEnd()
                setState(nextState)
            }),
        )

        const addPolygonProgram$ = makeAddPolygonProgram(
            onMouseClickTranslated$.pipe(map(mapPointToSnap)),
            fromEventType(AddEventTypes.AddPolygon),
            dispatch,
        ).pipe(repeat())

        const newPolygonAndShapes$ = combineLatest(
            addPolygonProgram$.pipe(startWith([] as Point[])),
            shapes$.pipe(startWith([] as Shape<T>[])),
            hoverIndexNoop$.pipe(startWith([] as number[])),
            // addMode$,
        )

        const draw$ = newPolygonAndShapes$.pipe(
            tap(data => {
                const [newPolygon, shapes, hoverIndices] = data
                pencil.resetStyles(ctx)

                // Clear the canvas
                ctx.save()
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                // Use the identity matrix while clearing the canvas
                ctx.setTransform(1, 0, 0, 1, 0, 0)
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.restore()
                // console.log(hoverIndices)
                // Draw existing polygons fin state

                const polygons = filterPolygonShapes(shapes)
                polygons.forEach((shape, index) => {
                    const hovering = hoverIndices.includes(index)
                    pencil.polygon({ ...shape, meta: { hovering, id: shape.meta } })
                    pencil.resetStyles(ctx)
                })

                // Draw potential new polygon
                // if (state.value === StateType.AddPolygon) {
                if (newPolygon.length > 1) {
                    pencil.polygon({
                        type: ShapeTypes.Polygon,
                        shape: [[...newPolygon, state.mousePosition]],
                        // TODO Provide a way to create T for new polygons
                        meta: { id: -1, hovering: true },
                    })

                    pencil.resetStyles(ctx)
                } else if (newPolygon.length === 1) {
                    pencil.line({
                        type: ShapeTypes.Line,
                        shape: [...newPolygon, state.mousePosition],
                        meta: (undefined as any) as T,
                    })
                    pencil.resetStyles(ctx)
                }

                newPolygon.forEach(point =>
                    pencil.marker({ type: ShapeTypes.Point, shape: point, meta: {} }),
                )
            }),
        )

        const subscription = merge(
            reduceActions$,
            updateStateWithMousePosition$,
            // logStateChange$,
            updatePointsDb$,
            ofKeyCode([117, 85]).pipe(tap(undo)),
            ofKeyCode([114, 82]).pipe(tap(redo)),
            draw$,
        ).subscribe()

        return {
            getState: () => state,
            getHistory: () => history,
            // subscribe: (cb: () => void) => {
            //     stateUpdates$.subscribe(cb)
            // },
            done: () => {
                subscription.unsubscribe()
            },
            api: {
                addPolygon: () => dispatch(addPolygon()),
                onAdd$: events$.pipe(
                    filter(
                        (event): event is SubmitNewPolygonEvent =>
                            event.type === AddEventTypes.SubmitNewPolygon,
                    ),
                ),
            },
        }
    }

    throw new Error('Canvas 2D Rendering Context Not Available')
}
