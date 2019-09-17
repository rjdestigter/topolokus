import { fromEvent, Observable, Subject, merge, concat } from 'rxjs'
import * as T from './types'
import { map, takeUntil, tap, take, repeat } from 'rxjs/operators'
import drawMarker_ from './draw/marker'
import mapMouseEventToCoords from './utils/mapMouseEventToCoords'
import { enterKey$ } from './legacy/observables'

export function withCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!

    const drawMarker = drawMarker_(ctx)

    const stateSubject = new Subject<T.State>()

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

    const onMouseClickObservable = fromEvent<MouseEvent>(canvas, 'click').pipe(
        map(e => mapMouseEventToCoords(e)),
    )

    const onMouseMoveObservable = fromEvent<MouseEvent>(canvas, 'mousemove').pipe(
        map(e => mapMouseEventToCoords(e)),
    )

    const updateStateWithMousePosition = onMouseMoveObservable.pipe(
        tap(evt => {
            setState({
                ...state,
                mousePosition: evt,
            })
        }),
    )

    const logStateChange = stateSubject.pipe(tap(console.log))

    const drawPoint = onMouseClickObservable.pipe(tap(drawMarker))

    const subscription = merge(
        concat(
            updateStateWithMousePosition.pipe(takeUntil(enterKey$)),
            drawPoint.pipe(take(5)),
        ).pipe(repeat()),
        logStateChange,
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
    }
}
