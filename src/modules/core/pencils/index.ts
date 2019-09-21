import defaultMarker from './marker'
import defaultPolygon from './polygon'
import defaultLine from './line'
import defaultResetStyles from './resetStyles'
import defaultCursor from './cursor'
import eraser from './eraser'

interface Api {
    marker: typeof defaultMarker
    polygon: typeof defaultPolygon
    line: typeof defaultLine
    cursor: typeof defaultCursor
    resetStyles: typeof defaultResetStyles
}

export default (api: Partial<Api> = {}) => (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')

    if (ctx) {
        const finalMarker = (api.marker || defaultMarker)(ctx)
        const finalPolygon = (api.polygon || defaultPolygon)(finalMarker)(ctx)
        const finalLine = (api.line || defaultLine)(finalMarker)(ctx)
        const cursor = (api.cursor || defaultCursor)(ctx)
        const resetStyles = (api.resetStyles || defaultResetStyles)(ctx)

        return {
            marker: finalMarker,
            polygon: finalPolygon,
            line: finalLine,
            resetStyles,
            cursor,
            eraser: eraser(canvas),
            api: {
                marker: defaultMarker,
                polygon: defaultPolygon(finalMarker),
                line: defaultLine(finalMarker),
                resetStyles: defaultResetStyles,
                cursor: defaultCursor,
                eraser,
            },
        }
    }
}
