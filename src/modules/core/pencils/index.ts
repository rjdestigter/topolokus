import defaultMarker from './marker'
import defaultPolygon from './polygon'
import defaultLine from './line'
import defaultResetStyles from './resetStyles'
import defaultCursor from './cursor'

interface Api {
    marker: typeof defaultMarker
    polygon: typeof defaultPolygon
    line: typeof defaultLine
    cursor: typeof defaultCursor
    resetStyles: typeof defaultResetStyles
}

export default (api: Partial<Api> = {}) => (ctx: CanvasRenderingContext2D) => {
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
        api: {
            marker: defaultMarker,
            polygon: defaultPolygon,
            line: defaultLine,
            resetstyles: defaultResetStyles,
            cursor: defaultCursor,
        },
    }
}
