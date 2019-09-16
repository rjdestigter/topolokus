import { ConnectableObservable, fromEvent, Observable, of, OperatorFunction, race, Subject } from 'rxjs'
import { filter, map, multicast, publish, switchMapTo, take } from 'rxjs/operators'

import { Either, left, right } from 'fp-ts/lib/Either'

import { mapMouseEventToCoords } from './utils'

export const toMulticast = <T>(observable: Observable<T>, connect = true): ConnectableObservable<T> => {
    const publishedObservable: ConnectableObservable<T> = observable.pipe(publish()) as any

    if (connect === true) {
        publishedObservable.connect()
    }

    return publishedObservable
}

/**
 *
 * @param event
 */
export const createEventObservableCreator = <E = MouseEvent>(event: string) => (mouseCanvas: HTMLCanvasElement) =>
    toMulticast(fromEvent<E>(mouseCanvas, event))

/**
 *
 */
export const createMouseMoveObservable = createEventObservableCreator<MouseEvent>('mousemove')

/**
 *
 */
export const createMouseDownObservable = createEventObservableCreator<MouseEvent>('mousedown')

/**
 *
 */
export const createMouseUpObservable = createEventObservableCreator<MouseEvent>('mouseup')

/**
 *
 */
export const createMouseClickObservable = createEventObservableCreator<MouseEvent>('click')

export const createMouseMovePosObservable = (mouseMove$: Observable<MouseEvent>) =>
    mouseMove$.pipe(map(mapMouseEventToCoords))

export const createMouseDownPosObservable = (mouseDown$: Observable<MouseEvent>) =>
    mouseDown$.pipe(map(mapMouseEventToCoords))

export const createMouseUpPosObservable = (mouseUp$: Observable<MouseEvent>) =>
    mouseUp$.pipe(map(mapMouseEventToCoords))

export const createMouseClickPosObservable = (mouseClick$: Observable<MouseEvent>) =>
    mouseClick$.pipe(map(mapMouseEventToCoords))

export const keyPress$ = fromEvent(document, 'keypress')
// @ts-ignore
export const enterKey$ = keyPress$.pipe(filter((event: KeyboardEvent) => event.keyCode === 13))

/**
 * From one observable to a race between 2 others to a observable of Eihter<L, R>
 * @param observable
 */
export const fromObservableToEither =
    // From observable T
    <A>(observable: Observable<A>) =>
        // with observable L
        <L>(leftObservable: Observable<L>) =>
            // And observable R
            <R>(rightObservable: Observable<R>): Observable<Either<L, R>> =>
                // To observable Either<L, R>
                observable.pipe(
                    switchMapTo(
                        // Race left or right
                        race(
                            leftObservable.pipe(map((evt: L): Either<L, R> => left(evt))),
                            rightObservable.pipe(map((evt: R): Either<L, R> => right(evt))),
                        ).pipe(take(1)),
                    ),
                )

export const mapRight = <L, R>(observable: Observable<Either<L, R>>) =>
    observable.pipe(
        filter(lr => lr.isRight()),
        map(rightEither => rightEither.value as R),
    )

export const mapRightTo = <L, R>(observable: Observable<Either<L, R>>) => (operatorFn: OperatorFunction<R, R>) =>
    mapRight(observable).pipe(operatorFn)

export const mapLeft = <L, R>(observable: Observable<Either<L, R>>) =>
    observable.pipe(
        filter(lr => lr.isLeft()),
        map(leftEither => leftEither.value as L),
    )

export const mapLeftTo = <L, R>(observable: Observable<Either<L, R>>) => (operatorFn: OperatorFunction<L, L>) =>
    mapLeft(observable).pipe(operatorFn)

export default (mouseCanvas: HTMLCanvasElement, canvas: HTMLCanvasElement) => {
    const mouseMove$ = createMouseMoveObservable(mouseCanvas)
    const mouseDown$ = createMouseDownObservable(mouseCanvas)
    const mouseUp$ = createMouseUpObservable(mouseCanvas)
    const mouseClick$ = createMouseClickObservable(mouseCanvas)

    const mouseMovePos$ = createMouseMovePosObservable(mouseMove$)
    const mouseDownPos$ = createMouseDownPosObservable(mouseDown$)
    const mouseUpPos$ = createMouseUpPosObservable(mouseUp$)
    const mouseClickPos$ = createMouseClickPosObservable(mouseClick$)

    const mouseMoveEventOrUpPos$ = fromObservableToEither(mouseDown$)(mouseMove$)(mouseUpPos$)
    const mouseUpEventOrMovePos$ = fromObservableToEither(mouseDown$)(mouseUp$)(mouseMovePos$)

    const mapToUpPosFromEither = mapRightTo(mouseMoveEventOrUpPos$)
    const mapToMovePosFromUpMoveEither = mapLeftTo(mouseUpEventOrMovePos$)

    return {
        mouseMove$,
        mouseDown$,
        mouseUp$,
        mouseClick$,
        mouseMovePos$,
        mouseDownPos$,
        mouseUpPos$,
        mouseClickPos$,
        keyPress$,
        enterKey$,
        mouseMoveEventOrUpPos$,
        mouseUpEventOrMovePos$,
        mapToUpPosFromEither,
        mapToMovePosFromUpMoveEither,
        toMulticast,
    }
}
