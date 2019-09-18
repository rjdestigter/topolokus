import { fromEvent, merge } from 'rxjs'
import { map, tap, repeat, filter } from 'rxjs/operators'

import KDBush from 'kdbush'

import { StateType, State, Point, Polygon } from './types'
import mapMouseEventToCoords from './utils/mapMouseEventToCoords'
import pencil_ from './draw'
import { Event } from './events'
import transition from './reducers'
import { stateUpdates$, events$, mapFirst, state$, stateChanges$ } from './observables'
import { pointsS } from './selectors'

import { AddState } from './add/types'
import { addPolygon } from './add/events'
import makeAddPolygonProgram from './add/observables'

export function withCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')

    if (ctx != null) {
        const pencil = pencil_()(ctx)

        const dispatch = (event: Event) => events$.next(event)

        const mapPointToSnap = ([x, y]: [number, number]): [number, number] => {
            const pointSnap = pointsS(state)[pointsDb.within(x, y, 10)[0]]

            return pointSnap ? [pointSnap[0], pointSnap[1]] : [x, y]
        }

        let pointsDb: KDBush.KDBush<Point> =
            // @ts-ignore
            new KDBush([])

        const updatePointsDb$ = stateChanges$.pipe(
            filter(([c, n]) => c.polygons !== n.polygons),
            mapFirst,
            map(pointsS),
            tap(points => {
                // @ts-ignore
                pointsDb = new KDBush(points)
            }),
        )

        const square: Polygon = [
            [[100, 100], [300, 100], [300, 300], [100, 300]],
            // @ts-ignore
            [[150, 150], [250, 150], [250, 250], [150, 250]].reverse(),
        ]

        let state: State = {
            mousePosition: [0, 0],
            value: StateType.Noop,
            polygons: [square],
            hovering: false,
        }

        const history: State[] = []

        const setState = (nextState: State) => {
            history.push(state)
            state = nextState
            stateUpdates$.next([state, history[history.length - 1] || state])
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
                setState({
                    ...state,
                    mousePosition: mousePosition as [number, number],
                })
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
            filter((state): state is AddState => state.value === StateType.AddPolygon),
        )

        const draw$ = state$.pipe(
            tap(state => {
                pencil.resetStyles(ctx)

                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height)

                // Draw existing polygons in state
                state.polygons.forEach(polygon => {
                    pencil.polygon(polygon)
                    pencil.resetStyles(ctx)
                })

                // Draw potential new polygon
                if (state.value === StateType.AddPolygon) {
                    if (state.newPolygon.length > 1) {
                        pencil.polygon([[...state.newPolygon, state.mousePosition]])
                        pencil.resetStyles(ctx)
                    } else if (state.newPolygon.length === 1) {
                        pencil.line([...state.newPolygon, state.mousePosition])
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
            makeAddPolygonProgram(
                onMouseClick$.pipe(map(mapPointToSnap)),
                addPolygonState$,
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
                load: (polygons: Polygon[]) =>
                    setState({
                        ...state,
                        polygons: [...state.polygons, ...polygons],
                    }),
            },
        }
    }

    throw new Error('Canvas 2D Rendering Context Not Available')
}

export default withCanvas
