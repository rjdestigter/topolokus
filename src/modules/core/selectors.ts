import { State, Point, StateType } from './types'
import { memoize } from './utils'

const emptyArray: any[] = []

export const polygonsS = (state: State) => state.polygons

export const newPolygonS = (state: State): Point[] => {
    if (state.value === StateType.AddPolygon) {
        return state.newPolygon
    }

    return emptyArray
}

export const pointsS = memoize((state: State): Point[] =>
    polygonsS(state).reduce(
        (acc, polygon) => {
            polygon.forEach(line => {
                line.forEach(point => {
                    acc.push(point)
                })
            })

            return acc
        },
        emptyArray as Point[],
    ),
)
