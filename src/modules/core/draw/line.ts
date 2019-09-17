import { Point } from '../types'

/**
 * Draw the position of the mouse as circle on canvas
 */
export default (marker: (point: Point, ctx?: CanvasRenderingContext2D) => void) => (
    ctx: CanvasRenderingContext2D,
) => (points: Point[], context = ctx) => {
    context.beginPath()

    const [[hx, hy], ...t] = points

    context.moveTo(hx, hy)

    t.forEach(([x, y]) => {
        context.lineTo(x, y)
    })

    context.stroke()

    points.forEach(point => marker(point, context))
}
