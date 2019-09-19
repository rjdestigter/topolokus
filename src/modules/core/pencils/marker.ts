import { PointShape } from '../types'

/**
 * Draw the position of the mouse as circle on canvas
 */
export default (ctx: CanvasRenderingContext2D) => (point: PointShape<any>, context = ctx) => {
    context.beginPath()
    context.arc(point.shape[0], point.shape[1], 5, 0, 2 * Math.PI)
    context.fillStyle = '#fff'
    context.fill()
    context.stroke()
    context.closePath()
}
