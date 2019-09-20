import { Point } from '../types'

/**
 * Draw the position of the mouse as circle on canvas
 */
export default (ctx: CanvasRenderingContext2D) => (data: {
    type: 'P' | 'M' | 'L'
    point: Point
}) => {
    const [x, y] = data.point
    ctx.fillStyle = 'transparent'
    ctx.lineWidth = 1

    ctx.beginPath()
    ctx.arc(x, y, 1, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill()
    ctx.closePath()

    ctx.lineWidth = 2
    ctx.strokeStyle =
        // if
        data.type === 'P'
            ? // then
              'Yellow'
            : // else if
            data.type === 'L'
            ? // then
              'Cyan'
            : // else
              'Black'

    ctx.beginPath()
    ctx.arc(x, y, 15, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.fill()
    ctx.closePath()
}
