export default (canvas: HTMLCanvasElement) => () => {
    const ctx = canvas.getContext('2d')

    if (ctx) {
        ctx.save()

        // Use the identity matrix while clearing the canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0)

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.restore()
    }
}
