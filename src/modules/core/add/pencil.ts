import { Pencil } from '../pencils'
import { Point, ShapeTypes, Snap, SnapType } from '../types'

export default (pencil: Pencil) => (ctx: CanvasRenderingContext2D) => (
    mousePosition: Snap,
    polygon: Point[],
) => {
    pencil.eraser()

    // Draw potential new polygon
    // if (state.value === StateType.AddPolygon) {
    if (polygon.length > 1) {
        pencil.polygon({
            type: ShapeTypes.Polygon,
            shape: [[...polygon, mousePosition.point]],
            // TODO Provide a way to create T for new polygons
            meta: { id: -1, hovering: true },
        })

        pencil.resetStyles()
    } else if (polygon.length === 1) {
        pencil.line({
            type: ShapeTypes.Line,
            shape: [...polygon, mousePosition.point],
            meta: undefined as any,
        })
        pencil.resetStyles()
    }

    polygon.forEach(point =>
        pencil.marker({
            type: ShapeTypes.Point,
            shape: point,
            meta: {},
        }),
    )

    if (mousePosition.type === SnapType.Line) {
        ctx.beginPath()
        ctx.moveTo(mousePosition.line[0][0], mousePosition.line[0][1])
        ctx.lineTo(mousePosition.line[1][0], mousePosition.line[1][1])
        ctx.strokeStyle = 'Cyan'
        ctx.stroke()
        // ctx
    }

    pencil.cursor(mousePosition)
}
