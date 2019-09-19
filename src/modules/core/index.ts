import { fromEvent, merge, Subject, Observable } from 'rxjs'
import { map, tap, repeat, filter, scan } from 'rxjs/operators'

import KDBush from 'kdbush'

import { StateType, State, Point, Shape, SharedState, ShapeTypes } from './types'
import mapMouseEventToCoords from './utils/mapMouseEventToCoords'
import pencil_ from './pencils'
import { Event } from './events'
import transition from './reducers'
import { mapFirst, ofKeyCode, makeFromEventType, makeEventTypes } from './observables'
import { convertShapesToListOfPoints } from './selectors'

import { AddState } from './add/types'
import { addPolygon, AddEventTypes } from './add/events'
import makeAddPolygonProgram from './add/observables'
import { isPolygonShape } from './utils'

export default <T>(shapes$: Observable<Shape<T>[]>) => (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')

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
        const state$ = stateChanges$.pipe(mapFirst)

        /**
         * Finds the nearest point a given point can snap to
         */
        const mapPointToSnap = ([x, y]: [number, number]): [number, number] => {
            const pointSnap = convertShapesToListOfPoints(shapesState)[pointsDb.within(x, y, 10)[0]]

            return pointSnap ? [pointSnap[0], pointSnap[1]] : [x, y]
        }

        /**
         *
         */
        const updatePointsDb$ = shapes$.pipe(
            map(convertShapesToListOfPoints),
            tap(points => {
                // @ts-ignore
                pointsDb = new KDBush(points)
            }),
        )

        let state: State<T> = {
            mousePosition: [0, 0],
            value: StateType.Noop,
            hovering: false,
        }

        let shapesState: Shape<T>[] = []
        shapes$.subscribe(shapes => (shapesState = shapes))

        const history: State<T>[] = []
        let future: State<T>[] = []

        const setState = (nextState: State<T>, affectsHistory = true) => {
            const prev = state

            if (affectsHistory) {
                history.push(state)
                future = []
            }

            state = nextState
            stateUpdates$.next([state, prev])
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

        const onMouseMoveObservable = fromEvent<MouseEvent>(canvas, 'mousemove').pipe(
            map(e => mapMouseEventToCoords(e)),
        )

        const updateStateWithMousePosition$ = onMouseMoveObservable.pipe(
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

        const addPolygonState$ = state$.pipe(
            filter(
                (state): state is SharedState<T> & AddState => state.value === StateType.AddPolygon,
            ),
        )

        const stateAndShapes$ = merge(state$, shapes$).pipe(
            scan(
                (acc, next) => {
                    if (Array.isArray(next)) {
                        return [acc[0], next] as const
                    }

                    return [next, acc[1]] as const
                },
                [state as State<T>, shapesState] as const,
            ),
        )

        const draw$ = stateAndShapes$.pipe(
            tap(([state, shapes]) => {
                pencil.resetStyles(ctx)

                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height)

                // Draw existing polygons in state
                shapes.forEach(shape => {
                    if (isPolygonShape(shape)) {
                        pencil.polygon(shape)
                        pencil.resetStyles(ctx)
                    }
                })

                // Draw potential new polygon
                if (state.value === StateType.AddPolygon) {
                    if (state.newPolygon.length > 1) {
                        pencil.polygon({
                            type: ShapeTypes.Polygon,
                            shape: [[...state.newPolygon, state.mousePosition]],
                            // TODO Provide a way to create T for new polygons
                            meta: (undefined as any) as T,
                        })
                        pencil.resetStyles(ctx)
                    } else if (state.newPolygon.length === 1) {
                        pencil.line({
                            type: ShapeTypes.Line,
                            shape: [...state.newPolygon, state.mousePosition],
                            meta: (undefined as any) as T,
                        })
                        pencil.resetStyles(ctx)
                    }
                }
            }),
        )

        const subscription = merge(
            reduceActions$,
            updateStateWithMousePosition$,
            // logStateChange$,
            updatePointsDb$,
            ofKeyCode([117, 85]).pipe(tap(undo)),
            ofKeyCode([114, 82]).pipe(tap(redo)),
            makeAddPolygonProgram(
                onMouseClick$.pipe(map(mapPointToSnap)),
                addPolygonState$,
                fromEventType(AddEventTypes.AddPolygon),
                dispatch,
            ).pipe(repeat()),
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
            },
        }
    }

    throw new Error('Canvas 2D Rendering Context Not Available')
}
