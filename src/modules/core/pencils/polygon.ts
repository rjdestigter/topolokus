import { PointShape, PolygonShape, ShapeTypes } from '../types'

const colors = [
    (n = 1) => `rgba(255,0,0,${n})`,
    (n = 1) => `rgba(0,255,0,${n})`,
    (n = 1) => `rgba(0,0,255,${n})`,
    (n = 1) => `rgba(255,255,0,${n})`,
    (n = 1) => `rgba(0,255,255,${n})`,
    (n = 1) => `rgba(255,0,255,${n})`,
    (n = 1) => `rgba(255,127,80,${n})`,
    (n = 1) => `rgba(255,20,147,${n})`,
    (n = 1) => `rgba(255,0,0,${n})`,
    (n = 1) => `rgba(0,255,0,${n})`,
    (n = 1) => `rgba(0,0,255,${n})`,
    (n = 1) => `rgba(255,255,0,${n})`,
    (n = 1) => `rgba(0,255,255,${n})`,
    (n = 1) => `rgba(255,0,255,${n})`,
    (n = 1) => `rgba(255,127,80,${n})`,
    (n = 1) => `rgba(255,20,147,${n})`,
]

type Meta = { id: number; isHovering?: boolean; isSelected?: boolean }

type MarkerPencil<T extends Meta> = (point: PointShape<T>, ctx?: CanvasRenderingContext2D) => void
/**
 * Draw the position of the mouse as circle on canvas
 */
export default <T extends Meta>(marker: MarkerPencil<T>) => (ctx: CanvasRenderingContext2D) => (
    polygon: PolygonShape<T>,
    context = ctx,
) => {
    //
    context.beginPath()

    polygon.shape.forEach(ring => {
        const [[hx, hy], ...t] = ring

        context.moveTo(hx, hy)

        t.forEach(([x, y]) => {
            context.lineTo(x, y)
        })
        context.closePath()
    })

    const filled = polygon.meta.isSelected || polygon.meta.isHovering

    context.fillStyle =
        (colors[polygon.meta.id] && colors[polygon.meta.id](filled ? 1 : 0.5)) ||
        `rgba(255, 255, 255, ${filled ? 1 : 0.5})`
    context.strokeStyle =
        (colors[polygon.meta.id] && colors[polygon.meta.id](1)) || `rgba(255, 255, 255, 1)`

    context.lineWidth = 1
    context.lineJoin = 'round'

    context.fill()

    context.stroke()

    // if (polygon.meta.isSelected)
    //     polygon.shape.forEach(ring =>
    //         ring.forEach(point =>
    //             marker({ shape: point, meta: polygon.meta, type: ShapeTypes.Point }, context),
    //         ),
    //     )
}
