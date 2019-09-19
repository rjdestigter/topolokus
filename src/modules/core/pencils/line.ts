import { PointShape, LineShape, ShapeTypes } from '../types'

/**
 * Draw the position of the mouse as circle on canvas
 */
export default (marker: (point: PointShape<any>, ctx?: CanvasRenderingContext2D) => void) => (
    ctx: CanvasRenderingContext2D,
) => (line: LineShape<any>, context = ctx) => {
    context.beginPath()

    const [[hx, hy], ...t] = line.shape

    context.moveTo(hx, hy)

    t.forEach(([x, y]) => {
        context.lineTo(x, y)
    })

    context.stroke()

    line.shape.forEach(point =>
        marker({ type: ShapeTypes.Point, shape: point, meta: line.meta }, context),
    )
}
