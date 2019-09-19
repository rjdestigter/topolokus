import { fromEvent, Observable } from 'rxjs'
import { map, filter, tap } from 'rxjs/operators'

import { Event, EventType } from './events'

import { first } from './utils'

/** Maps an observable of a tuple to an observable of the first element in the tuple */
export const mapFirst = map(first)

/**
 *
 */
export const makeEventTypes = (events$: Observable<Event>) => events$.pipe(map(event => event.type))

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
export const keyPress$ = fromEvent<KeyboardEvent>(document, 'keypress') // .pipe(tap(console.info))

/**
 *
 */
export const keyPressCode$ = keyPress$.pipe(
    map(evt => evt.keyCode),
    tap(k => console.warn(k)),
)

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
