import { Point } from '../types'

/**
 * Draw the position of the mouse as circle on canvas
 */
export default (ctx: CanvasRenderingContext2D) => (
    [x, y]: Point,
    options: { snap?: 'P' | 'L' } = {},
) => {
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
        options.snap === 'P'
            ? // then
              'Yellow'
            : // else if
            options.snap === 'L'
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
