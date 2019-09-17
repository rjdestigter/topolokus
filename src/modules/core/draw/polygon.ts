import { Polygon, Point } from '../types'

/**
 * Draw the position of the mouse as circle on canvas
 */
export default (marker: (point: Point, ctx?: CanvasRenderingContext2D) => void) => (
    ctx: CanvasRenderingContext2D,
) => (polygon: Polygon, context = ctx) => {
    context.beginPath()

    const [[hx, hy], ...t] = polygon

    context.moveTo(hx, hy)

    t.forEach(([x, y]) => {
        context.lineTo(x, y)
    })

    context.fillStyle = 'Cyan'

    context.fill()

    context.closePath()

    context.stroke()

    polygon.forEach(point => marker(point, context))
}
