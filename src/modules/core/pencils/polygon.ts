import { PointShape, PolygonShape, ShapeTypes } from '../types'

/**
 * Draw the position of the mouse as circle on canvas
 */
export default <T>(marker: (point: PointShape<T>, ctx?: CanvasRenderingContext2D) => void) => (
    ctx: CanvasRenderingContext2D,
) => (polygon: PolygonShape<T>, context = ctx) => {
    context.beginPath()

    polygon.shape.forEach(ring => {
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

    polygon.shape.forEach(ring =>
        ring.forEach(point =>
            marker({ shape: point, meta: polygon.meta, type: ShapeTypes.Point }, context),
        ),
    )
}
