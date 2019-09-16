import {
    Feature,
    FeatureCollection,
    Geometry,
    GeometryCollection,
    LineString,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    Point,
    Polygon,
    Properties,
} from '@turf/helpers'

/**
 * Type alias representing a pixel value
 */
export type Pixel = number

/**
 * Type alias representing a tuple of pixels referring to x, y coordinates on a canvas
 */
export type Pixels = [Pixel, Pixel]

/**
 * Type alias for lattitude
 */
export type Lat = number

/**
 * Type alias for longtitude
 */
export type Lng = number

/**
 * Type alias for (longtitude, lattitude) coordinate tuple
 */
export type LngLat = [Lng, Lat]

/**
 * Type alias referring to a coordinate set containing both
 * canvas pixel coordinate and its related longtitude, lattitude coordinate
 */
export type QPosition = [Pixel, Pixel, Lng, Lat]

/**
 * Type refering to any kind of numeric tuple that has at least 2 elements
 */
export type PositionLike = [number, number, ...number[]]

/**
 * Geometries
 */
export type QGeometries = QPoint | QLineString | QPolygon | QMultiPoint | QMultiLineString | QMultiPolygon

export interface QGeometry extends Geometry {
    coordinates: QPosition | QPosition[] | QPosition[][] | QPosition[][][]
}

export interface QPoint extends Point {
    coordinates: QPosition
}

export interface QMultiPoint extends MultiPoint {
    coordinates: QPosition[]
}

export interface QLineString extends LineString {
    coordinates: QPosition[]
}

export interface QMultiLineString extends MultiLineString {
    coordinates: QPosition[][]
}

export interface QPolygon extends Polygon {
    coordinates: QPosition[][]
}

export interface QMultiPolygon extends MultiPolygon {
    coordinates: QPosition[][][]
}

export interface QGeometryCollection extends GeometryCollection {
    geometries: Array<QPoint | QLineString | QPolygon | QMultiPoint | QMultiLineString | QMultiPolygon>
}

export interface QFeature<G = QGeometry | QGeometryCollection, P = Properties> extends Feature<G, P> {
    geometry: G
}

export interface QFeatureCollection<G = QGeometry | QGeometryCollection, P = Properties>
    extends FeatureCollection<G, P> {
    features: Array<QFeature<G, P>>
}

export type PolyLike =
    | Polygon
    | MultiPolygon
    | Feature<Polygon | MultiPolygon>
    | FeatureCollection<Polygon | MultiPolygon>

export type QPolyLike =
    | QPolygon
    | QMultiPolygon
    | QFeature<QPolygon | QMultiPolygon>
    | QFeatureCollection<QPolygon | QMultiPolygon>

export interface PolyItem<T = any> {
    id: string
    index: number
    geoJSON: QPolyLike
    data: T
}

export enum ActionTypes {
    LOAD = '@locis/load',
    UPDATE_MOUSE_POSITION = '@locis/update.mouse.position',
    DRAW_POLYGON = '@locis/draw.polygon',
    ADD = '@locis/add.polygon',
    ADD_POINT_IN_PROGRESS = '@locis/add.pointInProgress',
    NOOP = '@locis/noop',
    SELECT = '@locis/select.polyItem',
    SELECT_POINT = '@locis/select.point',
    UPDATE_GEOJSON = '@locis/update.geojson',
}

export interface LoadAction {
    type: ActionTypes.LOAD
    payload: {
        polyItems: PolyItem[]
        lines: [QPosition, QPosition][]
        coordinates: QPosition[]
        pointsInProgress: QPosition[]
    }
}
export interface UpdateMousePositionAction {
    type: ActionTypes.UPDATE_MOUSE_POSITION
    payload: [number, number]
}

export interface DrawPolygonAction {
    type: ActionTypes.DRAW_POLYGON
    payload: undefined
}

export interface AddAction {
    type: ActionTypes.ADD
    payload: PolyItem | PolyItem[]
}

export interface AddPointInProgressAction {
    type: ActionTypes.ADD_POINT_IN_PROGRESS
    payload: QPosition
}

export interface SelectAction {
    type: ActionTypes.SELECT
    payload: number | undefined
}

export interface SelectPointAction {
    type: ActionTypes.SELECT_POINT
    payload: QPosition | undefined
}

export interface NoopAction {
    type: ActionTypes.NOOP
}

export type Actions =
    | LoadAction
    | UpdateMousePositionAction
    | DrawPolygonAction
    | AddAction
    | AddPointInProgressAction
    | NoopAction
    | SelectAction
    | SelectPointAction

export interface LocisState {
    lastKnownMousePosition: Pixels
    pointsInProgress: QPosition[]
    geoJSON: PolyItem[]
    points: QPosition[]
    drawing: boolean
    lines: [QPosition, QPosition][]
    lineSnap: boolean
    pointSnap: boolean
    selectedIndex: number | undefined
    selectedPoint: QPosition | undefined
}

export type Snap =
    | { type: 'P'; coord: QPosition }
    | { type: 'L'; coord: QPosition; line: [QPosition, QPosition] }
    | { type: 'N'; coord: QPosition }
