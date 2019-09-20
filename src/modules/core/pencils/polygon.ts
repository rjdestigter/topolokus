import { PointShape, PolygonShape } from '../types'

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

/**
 * Draw the position of the mouse as circle on canvas
 */
export default <T extends { hovering: boolean }>(
    marker: (point: PointShape<T>, ctx?: CanvasRenderingContext2D) => void,
) => (ctx: CanvasRenderingContext2D) => (polygon: PolygonShape<T>, context = ctx) => {
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

    context.fillStyle =
        // @ts-ignore
        (colors[polygon.meta.id] && colors[polygon.meta.id](polygon.meta.hovering ? 1 : 0.5)) ||
        `rgba(255, 255, 255, ${polygon.meta.hovering ? 1 : 0.5})`
    context.strokeStyle =
        // @ts-ignore
        (colors[polygon.meta.id] && colors[polygon.meta.id](1)) || `rgba(255, 255, 255, 1)`

    context.lineWidth = 1
    context.lineJoin = 'round'

    context.fill()

    context.stroke()

    // polygon.shape.forEach(ring =>
    //     ring.forEach(point =>
    //         marker({ shape: point, meta: polygon.meta, type: ShapeTypes.Point }, context),
    //     ),
    // )
}
