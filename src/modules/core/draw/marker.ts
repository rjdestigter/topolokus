/**
 * Draw the position of the mouse as circle on canvas
 */
export default (ctx: CanvasRenderingContext2D) => ([x, y]: [number, number], context = ctx) => {
    context.beginPath()
    context.arc(x, y, 5, 0, 2 * Math.PI)
    context.fill()
    context.stroke()
    context.closePath()
}
