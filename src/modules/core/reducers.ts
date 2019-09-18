import { State } from './types'
import { Event } from './events'
import addReducer from './add/reducer'

export default (state: State, event: Event): State => addReducer(state, event)
