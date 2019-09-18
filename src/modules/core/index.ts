import { fromEvent, merge } from 'rxjs'
import * as T from './types'
import { map, tap, repeat, filter } from 'rxjs/operators'
import mapMouseEventToCoords from './utils/mapMouseEventToCoords'
import pencil_ from './draw'

import { Event } from './events'

import transition from './reducers'
import { AddState } from './add/types'
import { addPolygon } from './add/events'

import makeAddPolygonProgram from './add/observables'

import { stateUpdates$, events$ } from './observables'

export function withCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')

    if (ctx != null) {
        const pencil = pencil_()(ctx)

        const dispatch = (event: Event) => events$.next(event)

        let state: T.State = {
            mousePosition: [0, 0],
            value: T.StateType.Noop,
            polygons: [],
            hovering: false,
        }

        const history: T.State[] = []

        const setState = (nextState: T.State) => {
            history.push(state)
            state = nextState
            stateUpdates$.next(state)
        }

        const onMouseClick$ = fromEvent<MouseEvent>(canvas, 'click').pipe(
            map(e => mapMouseEventToCoords(e)),
        )

        const onMouseMoveObservable = fromEvent<MouseEvent>(canvas, 'mousemove').pipe(
            map(e => mapMouseEventToCoords(e)),
        )

        const updateStateWithMousePosition$ = onMouseMoveObservable.pipe(
            tap(evt => {
                setState({
                    ...state,
                    mousePosition: evt,
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

        const addPolygonState$ = stateUpdates$.pipe(
            filter((state): state is AddState => state.value === T.StateType.AddPolygon),
        )

        const draw$ = stateUpdates$.pipe(
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
                if (state.value === T.StateType.AddPolygon) {
                    if (state.newPolygon.length > 1) {
                        pencil.polygon([...state.newPolygon, state.mousePosition])
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
            makeAddPolygonProgram(onMouseClick$, addPolygonState$, dispatch).pipe(repeat()),
            draw$,
        ).subscribe()

        return {
            getState: () => state,
            getHistory: () => history,
            subscribe: (cb: () => void) => {
                stateUpdates$.subscribe(cb)
            },
            done: () => {
                subscription.unsubscribe()
                stateUpdates$.complete()
            },
            api: {
                addPolygon: () => dispatch(addPolygon()),
            },
        }
    }

    throw new Error('Canvas 2D Rendering Context Not Available')
}
