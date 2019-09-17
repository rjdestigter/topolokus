import { Point } from '../types'

/**
 * Draw the position of the mouse as circle on canvas
 */
export default (ctx: CanvasRenderingContext2D) => ([x, y]: Point, context = ctx) => {
    context.beginPath()
    context.arc(x, y, 5, 0, 2 * Math.PI)
    context.fill()
    context.stroke()
    context.closePath()
}
