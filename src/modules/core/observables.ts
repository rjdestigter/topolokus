import { Subject, fromEvent } from 'rxjs'
import { map, filter } from 'rxjs/operators'

import { State } from './types'
import { Event, EventType } from './events'

/**
 *
 */
export const stateUpdates$ = new Subject<State>()

/**
 *
 */
export const events$ = new Subject<Event>()

/**
 *
 */
export const eventTypes$ = events$.pipe(map(event => event.type))

/**
 *
 */
export const fromEventType = <T extends EventType>(eventType: T) =>
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
export const keyPressCode$ = keyPress$.pipe(map(evt => evt.keyCode))

/**
 *
 */
export const ofKeyCode = (keyCode: number) =>
    keyPressCode$.pipe(filter(pressedKeyCode => pressedKeyCode === keyCode))

/**
 *
 */
export const enterKey$ = ofKeyCode(13)

/**
 *
 */
export const cancelKey$ = ofKeyCode(99)
