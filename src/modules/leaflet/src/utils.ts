import { Map, canvas } from 'leaflet'

import { Point } from '../../core/types'

/**
 * ```hs
 * translateOffsetOfCanvas :: HTMLCanvasElement -> (number, number) -> (number, number)
 * ```
 * @param canvas The canvas to adjust the coordinate of
 * @returns Coordinates of a canvas adjusted in relation to it's transformation.
 */
export const translateOffsetOfCanvas = (canvas: HTMLCanvasElement) => ([x, y]: [number, number]): [
    number,
    number,
] => {
    const [tx = 0, ty = 0] = (
        canvas.style.transform.match(/translate3d\((-?\d+)px[, ]+(-?\d+)px[, ]+(-?\d+)/) || []
    )
        .map(str => +str)
        .filter(n => !isNaN(n))

    return [x + tx, y + ty] as [number, number]
}

/**
 * toLngLat :: L.Map -> Point -> (numbr, number)
 * @param canvas
 */
export const toLngLat = (map: Map) => ([x, y, lng, lat]: Point | [number, number]): [
    number,
    number,
] => {
    const point = map.layerPointToLatLng([x, y])
    return [lng || point.lng, lat || point.lat]
}

/**
 * fromLngLat :: L.Map -> (number, number) -> Point
 * @param canvas
 */
export const fromLngLat = (map: Map) => ([lng, lat]: number[]): Point => {
    const point = map.latLngToLayerPoint([lat, lng + 0])
    return [point.x, point.y, lng, lat]
}

/**
 * createCanvasLayer :: String -> L.Canvas
 * @param canvas
 */
export const createCanvasLayer = (pane?: string) => canvas({ padding: 0, pane })
