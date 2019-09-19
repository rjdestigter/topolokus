import { State } from './types'
import { Event } from './events'
import addReducer from './add/reducer'

export default <T>(state: State<T>, event: Event): State<T> => addReducer(state, event)
