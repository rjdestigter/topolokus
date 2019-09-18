import { Subject, fromEvent } from 'rxjs'
import { map, filter } from 'rxjs/operators'

import { State } from './types'
import { Event, EventType } from './events'

import { first } from './utils'

/** Maps an observable of a tuple to an observable of the first element in the tuple */
export const mapFirst = map(first)

/**
 * Observable streaming current and previous state
 */
export const stateUpdates$ = new Subject<[State, State]>()

/**
 * Filters state updates by checking if state has actually changed
 */
export const stateChanges$ = stateUpdates$.pipe(filter(([c, p]) => c !== p))

/**
 * Maps state changes to actual state
 */
export const state$ = stateChanges$.pipe(mapFirst)

/** Emits `state.polygons` any time it changes */
export const polygons$ = state$.pipe(map(state => state.polygons))

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
