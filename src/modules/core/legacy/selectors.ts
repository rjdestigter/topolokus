import { flow } from 'fp-ts/lib/function'
import { LocisState } from './types'

const state$ = (state: LocisState) => state

const lastKnownMousePosition$ = flow(
    state$,
    state => state.lastKnownMousePosition,
)
const pointsInProgress$ = flow(
    state$,
    state => state.pointsInProgress,
)
const geoJSON$ = flow(
    state$,
    state => state.geoJSON,
)
const points$ = flow(
    state$,
    state => state.points,
)
const drawing$ = flow(
    state$,
    state => state.drawing,
)
const lines$ = flow(
    state$,
    state => state.lines,
)
const lineSnap$ = flow(
    state$,
    state => state.lineSnap,
)
const pointSnap$ = flow(
    state$,
    state => state.pointSnap,
)
const selectedIndex$ = flow(
    state$,
    state => state.selectedIndex,
)
const selectedPoint$ = flow(
    state$,
    state => state.selectedPoint,
)

const isDrawing$ = drawing$
