export function withCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')

    if (ctx) {
        ctx.beginPath()
        ctx.rect(100, 100, 400, 400)
        ctx.fillStyle = 'Red'
        ctx.fill()
        ctx.stroke()
    }
}
