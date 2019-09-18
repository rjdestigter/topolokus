import { Polygon, Point } from '../types'

/**
 * Draw the position of the mouse as circle on canvas
 */
export default (marker: (point: Point, ctx?: CanvasRenderingContext2D) => void) => (
    ctx: CanvasRenderingContext2D,
) => (polygon: Polygon, context = ctx) => {
    context.beginPath()

    polygon.forEach(ring => {
        const [[hx, hy], ...t] = ring

        context.moveTo(hx, hy)

        t.forEach(([x, y]) => {
            context.lineTo(x, y)
        })
        context.closePath()
    })

    context.fillStyle = 'Cyan'

    context.fill()

    context.stroke()

    polygon.forEach(ring => ring.forEach(point => marker(point, context)))
}
