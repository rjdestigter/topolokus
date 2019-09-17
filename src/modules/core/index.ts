import { fromEvent, Observable, Subject, merge, concat, of } from 'rxjs'
import * as T from './types'
import { map, takeUntil, tap, take, repeat, filter } from 'rxjs/operators'
import mapMouseEventToCoords from './utils/mapMouseEventToCoords'
import { enterKey$, cancelKey$ } from './legacy/observables'
import pencil_ from './draw'

import * as actions from './actions'

import { transition } from './reducers'
import { ActionTypes } from './types'
import isPolygon from './utils/isPolygon'

export function withCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')

    if (ctx != null) {
        const pencil = pencil_()(ctx)

        const stateSubject = new Subject<T.State>()
        const actionSubject = new Subject<T.Action>()

        const dispatch = (action: T.Action) => actionSubject.next(action)

        let state: T.State = {
            mousePosition: [0, 0],
            type: T.StateType.Noop,
            polygons: [],
            hovering: false,
        }

        const history: T.State[] = []

        const setState = (nextState: T.State) => {
            history.push(state)
            state = nextState
            stateSubject.next(state)
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

        // const logStateChange$ = stateSubject.pipe(tap(console.log))

        const reduceActions$ = actionSubject.pipe(
            tap(action => {
                const nextState = transition(state, action)
                console.groupCollapsed(action.type)
                console.log(action)
                console.log(state)
                console.groupEnd()
                setState(nextState)
            }),
        )

        const addPolygonState$ = stateSubject.pipe(
            filter((state): state is T.AddPolygonState => state.type === T.StateType.AddPolygon),
            tap(() => console.log('adding..')),
        )

        const dispatchSubmitNewPolygon = of(actions.submitNewPolygon()).pipe(
            tap(action => dispatch(action)),
        )

        const dispatchCancelNewPolygon = of(actions.cancelNewPolygon()).pipe(tap(dispatch))

        const submitNewPolygon$ = concat(
            addPolygonState$.pipe(
                filter(state => state.newPolygon.length > 2),
                take(1),
            ),
            enterKey$.pipe(take(1)),
            dispatchSubmitNewPolygon,
        ).pipe(
            filter(
                output =>
                    typeof output === 'object' && output.type === ActionTypes.SubmitNewPolygon,
            ),
        )

        const isNotNr = <T>(value: number | T): value is T => typeof value !== 'number'

        const cancelNewPolygon$ = concat(
            addPolygonState$.pipe(take(1)),
            cancelKey$.pipe(take(1)),
            dispatchCancelNewPolygon,
        ).pipe(
            filter(isNotNr),
            map(stateOrAction => stateOrAction.type),
            filter(type => type === ActionTypes.CancelNewPolygon),
        )

        const cancelOrSubmit$ = merge(submitNewPolygon$, cancelNewPolygon$)

        const addPointToPolygon$ = onMouseClick$.pipe(
            tap(point => dispatch(actions.addPointToNewPolygon(point))),
            takeUntil(cancelOrSubmit$),
        )

        const addPolygonAction$ = actionSubject.pipe(
            filter(action => action.type === T.ActionTypes.AddPolygon),
        )

        const addPolygonProgram$ = concat(addPolygonAction$.pipe(take(1)), addPointToPolygon$).pipe(
            repeat(),
        )

        const draw$ = stateSubject.pipe(
            tap(state => {
                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height)

                // Draw existing polygons in state
                state.polygons.forEach(polygon => pencil.polygon(polygon))

                // Draw potential new polygon
                if (state.type === T.StateType.AddPolygon) {
                    if (state.newPolygon.length > 1) {
                        pencil.polygon([...state.newPolygon, state.mousePosition])
                    } else if (state.newPolygon.length === 1) {
                        pencil.line([...state.newPolygon, state.mousePosition])
                    }
                }
            }),
        )

        const subscription = merge(
            reduceActions$,
            updateStateWithMousePosition$,
            // logStateChange$,
            addPolygonProgram$,
            draw$,
        ).subscribe()

        return {
            getState: () => state,
            getHistory: () => history,
            subscribe: (cb: () => void) => {
                stateSubject.subscribe(cb)
            },
            done: () => {
                subscription.unsubscribe()
                stateSubject.complete()
            },
            api: {
                addPolygon: () => dispatch(actions.addPolygon()),
            },
        }
    }

    throw new Error('Canvas 2D Rendering Context Not Available')
}
