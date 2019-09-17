import defaultMarker from './marker'
import defaultPolygon from './polygon'
import defaultLine from './line'

interface Api {
    marker: typeof defaultMarker
    polygon: typeof defaultPolygon
    line: typeof defaultLine
}

export default (api: Partial<Api> = {}) => (ctx: CanvasRenderingContext2D) => {
    const finalMarker = (api.marker || defaultMarker)(ctx)
    const finalPolygon = (api.polygon || defaultPolygon)(finalMarker)(ctx)
    const finalLine = (api.line || defaultLine)(finalMarker)(ctx)

    return {
        marker: finalMarker,
        polygon: finalPolygon,
        line: finalLine,
    }
}
