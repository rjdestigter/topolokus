import { fromEvent, Observable } from 'rxjs'
import { map, filter, mapTo } from 'rxjs/operators'

import { Event, EventType } from './events'

import { mapProp, first } from './utils'

export const mapFirst = map(first)

/**
 *
 */
export const mapObservableToProp = <K extends string>(k: K) => <T extends { [P in K]: T[K] }>(
    $: Observable<T>,
): Observable<T[K]> => $.pipe(map(mapProp(k)))

export const mapObservableToPropType = mapObservableToProp('type')

/**
 *
 */
export const makeFromEventType = (eventTypes$: Observable<Event['type']>) => <T extends EventType>(
    eventType: T,
) =>
    eventTypes$.pipe(
        filter(
            (dispatchedEventType): dispatchedEventType is T => eventType === dispatchedEventType,
        ),
    )

/**
 *
 */
export const keyPress$ = fromEvent<KeyboardEvent>(document, 'keypress')
/**
 *
 */
export const keyPressCode$ = keyPress$.pipe(map(evt => evt.keyCode))

/**
 *
 */
export const ofKeyCode = (keyCode: number | number[]) =>
    keyPressCode$.pipe(
        filter(pressedKeyCode =>
            Array.isArray(keyCode) ? keyCode.includes(pressedKeyCode) : pressedKeyCode === keyCode,
        ),
    )

/**
 *
 */
export const enterKey$ = ofKeyCode(13)

/**
 *
 */
export const cancelKey$ = ofKeyCode(99)

export const undoKey$ = keyPress$
    .pipe(filter(evt => evt.ctrlKey && [122, 90, 26].includes(evt.keyCode)))
    .pipe(mapTo('undo' as const))

export const redoKey$ = keyPress$
    .pipe(filter(evt => evt.ctrlKey && [121, 89, 25].includes(evt.keyCode)))
    .pipe(mapTo('redo' as const))
