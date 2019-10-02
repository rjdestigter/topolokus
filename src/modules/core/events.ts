import { AddEvent } from './add/events'

export type Event = AddEvent | { type: 'Noop' }

export type EventType = Event['type']
