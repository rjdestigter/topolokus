// RBush, KDBush
import KDBush from 'kdbush'
import * as _ from 'lodash'
import { actionCreators, actions } from './actions'
import createPolyBush from './rbush'
import { reducer } from './reducer'
import {
    Actions,
    ActionTypes,
    DrawPolygonAction,
    LocisState,
    PolyItem,
    PolyLike,
    QPolyLike,
    QPosition,
    Snap,
} from './types'

import * as utils from './utils'

// TurfJS
import turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { MultiPolygon, point as turfPoint, Polygon, Position } from '@turf/helpers'
import { coordAll, coordEach, geomEach } from '@turf/meta'

// RxJS
import { from, fromEvent, Observable, OperatorFunction, race, Subject } from 'rxjs'
import {
    debounceTime,
    filter,
    map,
    mapTo,
    mergeMap,
    switchMap,
    switchMapTo,
    take,
    takeUntil,
} from 'rxjs/operators'

// Redux
import { Either, isRight, left, right } from 'fp-ts/lib/Either'
import {
    applyMiddleware,
    compose,
    createStore,
    Reducer,
    StoreEnhancer,
    StoreEnhancerStoreCreator,
} from 'redux'
import { createLogger } from 'redux-logger'
import { combineEpics, createEpicMiddleware, Epic } from 'redux-observable'

import createObservables from './observables'

// Types, Interfaces

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min)
}

// Exports
/**
 *
 * @param canvas
 */
export default function withCanvas<T>(
    canvas: HTMLCanvasElement,
    mouseCanvas: HTMLCanvasElement,
    fromLngLat: (xy: number[]) => number[],
    toLngLat: (xy: number[]) => number[],
    getGeoJson: (data: T) => PolyLike = _.identity,
    setGeoJson: (geoJSON: PolyLike, data: T) => T = _.identity,
) {
    // const mouseCanvas = document.createElement('canvas')
    // mouseCanvas.width = canvas.width
    // mouseCanvas.height = canvas.height
    // canvas.style.position = 'absolute'
    // mouseCanvas.style.position = 'absolute'
    // mouseCanvas.style.zIndex = canvas.style.zIndex
    mouseCanvas.style.cursor = 'none'
    // mouseCanvas.style.transform = canvas.style.transform

    // if (canvas.parentNode) {
    //     canvas.parentNode.appendChild(mouseCanvas)
    // }

    // State, storing points drawn and polygons drawn
    // const points: [number, number][] = []
    // const polygons: [number, number][][] = []

    // let lastKnownMousePosition: [number, number] = [0, 0]

    const ctx = canvas.getContext('2d')
    const mouseCtx = mouseCanvas.getContext('2d')

    if (ctx && mouseCtx) {
        // Observables
        const observables = createObservables(mouseCanvas, canvas)

        const actionSubject = new Subject<Actions>()

        const epicMiddleware = createEpicMiddleware()
        const store = createStore(
            reducer,
            applyMiddleware(
                epicMiddleware,
                () => next => action => {
                    next(action)
                    actionSubject.next(action)
                },
                createLogger({
                    predicate: (_getState, action) =>
                        action.type !== ActionTypes.UPDATE_MOUSE_POSITION,
                }),
            ),
        )

        const actions$ = observables.toMulticast(from(actionSubject))

        const addPolygon$ = actions$.pipe(
            filter(
                (action): action is DrawPolygonAction => action.type === ActionTypes.DRAW_POLYGON,
            ),
        )

        addPolygon$.subscribe(() => {
            debugger
        })

        const project = utils.projectGeoJSON(fromLngLat)
        // const unproject = utils.pointIsEqual

        let pointsDb: KDBush.KDBush<[number, number]> =
            // @ts-ignore
            new KDBush([])

        const updatePointsDb = () => {
            pointsDb =
                // @ts-ignore
                new KDBush(store.getState().points)
        }

        const polyDb = createPolyBush()
        const lineDb = createPolyBush()

        const load = (data: T[] = store.getState().geoJSON.map(item => item.data)) => {
            const lines: [QPosition, QPosition][] = []
            const coordinates: QPosition[] = []

            const project2 = project({ lines, coordinates })

            const pointsInProgress = store.getState().pointsInProgress.map(
                ([, , cx, cy]): QPosition => {
                    const [px, py] = fromLngLat([cx, cy])
                    return [px, py, cx, cy]
                },
            )

            coordinates.push(...pointsInProgress)

            const polyItems = data.map((datum, index) => {
                return {
                    id: `${index}`,
                    index,
                    geoJSON: project2(getGeoJson(datum)),
                    data: datum,
                }
            })

            store.dispatch(actionCreators.load({ polyItems, lines, coordinates, pointsInProgress }))

            updatePointsDb()

            polyDb.reset(...polyItems)

            draw()
        }

        const reloadEpic: Epic<Actions> = action$ =>
            action$.pipe(
                filter((action: Actions) => action.type === ActionTypes.ADD),
                map(() => load(store.getState().geoJSON.map(g => g.data))),
                mapTo(actions.noop),
            )

        const drawEpic: Epic<Actions> = action$ =>
            action$.pipe(
                filter((action: Actions) => action.type === ActionTypes.DRAW_POLYGON),
                map(() => {
                    subscribeAddNewPolyItem()
                    return actions.noop
                }),
            )

        const addPointInProgresseEpic: Epic<Actions> = action$ =>
            action$.pipe(
                filter((action: Actions) => action.type === ActionTypes.ADD_POINT_IN_PROGRESS),
                map(() => {
                    updatePointsDb()
                    return actions.noop
                }),
            )

        epicMiddleware.run(drawEpic)
        epicMiddleware.run(reloadEpic)
        epicMiddleware.run(addPointInProgresseEpic)

        interface Styles {
            fillStyle?: string
            strokeStyle?: string
            lineWidth?: number
            shadowBlur?: number
            shadowOffsetX?: number
            shadowOffsetY?: number
            shadowColor?: string
        }

        // Set some style properties used while drawing on to canvas
        const setStyles = (ctxStyles: Styles, context = ctx) =>
            // @ts-ignore
            Object.keys(ctxStyles).forEach(styleName => (context[styleName] = ctxStyles[styleName]))

        // Reset styles to defaults
        const resetStyles = (context = ctx) => {
            context.fillStyle = '#ffffff'
            context.strokeStyle = '#000000'
            context.lineWidth = 1
            context.shadowBlur = 0
            context.shadowOffsetX = 0
            context.shadowOffsetY = 0
            context.shadowColor = 'rgba(0, 0, 0, 0.2)'
        }

        resetStyles()

        /**
         * Clears the canvas
         */
        const resetCanvas = (context = ctx) => {
            context.clearRect(0, 0, canvas.width, canvas.height)
        }

        // Hide the cursor
        canvas.style.cursor = 'none'

        // Map a mouse event to the coordinates used for drawing

        const getSnapPosition = (xy: Position): Snap => {
            const state = store.getState()

            if (state.pointSnap) {
                const pointSnap = store.getState().points[pointsDb.within(xy[0], xy[1], 10)[0]]

                if (pointSnap) {
                    return { type: 'P', coord: pointSnap }
                }
            }

            // if (state.lineSnap) {
            // const lineSnap = utils.findLineSnapPosition(xy, state.lines)
            // if (lineSnap) {
            //     const [lng, lat] = toLngLat([lineSnap.point[0], lineSnap.point[1]])
            //     return {
            //         type: 'L',
            //         coord: [lineSnap.point[0], lineSnap.point[1], lng, lat],
            //         line: lineSnap.line,
            //     }
            // }
            // }

            const [lng2, lat2] = toLngLat([xy[0], xy[1]])
            return { type: 'N', coord: [xy[0], xy[1], lng2, lat2] }
        }

        /**
         * Draw the position of the mouse as circle on canvas
         */
        const drawMarker = (x: number, y: number, context = ctx) => {
            context.beginPath()
            context.arc(x, y, 5, 0, 2 * Math.PI)
            context.fill()
            context.stroke()
            context.closePath()
        }

        /**
         * Draw the position of the mouse as circle on canvas
         */
        const drawCursor = (snap: Snap, context = ctx) => {
            setStyles({ fillStyle: 'transparent', lineWidth: 1 }, context)
            context.beginPath()
            context.arc(snap.coord[0], snap.coord[1], 1, 0, 2 * Math.PI)
            context.stroke()
            context.fill()
            context.closePath()

            setStyles(
                {
                    lineWidth: 2,
                    strokeStyle:
                        snap.type === 'P' ? 'Yellow' : snap.type === 'L' ? 'Cyan' : 'Black',
                },
                context,
            )
            context.beginPath()
            context.arc(snap.coord[0], snap.coord[1], 15, 0, 2 * Math.PI)
            context.stroke()
            context.fill()
            context.closePath()
            resetStyles(context)
        }

        /**
         * Draw the position of the mouse as circle on canvas
         */
        const drawMousePosition = (snap: Snap) => {
            drawCursor(snap, mouseCtx)
        }

        /**
         * Draw the position of the mouse as circle on canvas
         */
        const drawHover = (snap: Snap) => {
            const items = polyDb.searchByPoint(snap.coord)
            items.forEach(polyItem => {
                drawPolyLikeGeometry(polyItem.geoJSON, snap, 'rgba(0,0,255,0.5)', mouseCtx)
            })
        }

        /**
         * Draw a point as a circle on canvas
         * @param param0
         */
        const drawPoint = ([px, py]: QPosition, context = ctx) => {
            drawMarker(px, py, ctx)
        }

        observables.mouseMovePos$.subscribe(xy =>
            store.dispatch(actionCreators.updateMousePosition(xy)),
        )

        /**
         * Draw points and lines currently being drawn
         * @param mousePosition The x, y coordinates of the mouse when moving or clicking
         */
        const drawInProgressPoints = (mousePosition: Position) => {
            const state = store.getState()

            if (state.pointsInProgress.length > 0) {
                if (state.pointsInProgress.length === 1) {
                    mouseCtx.beginPath()
                    mouseCtx.moveTo(state.pointsInProgress[0][0], state.pointsInProgress[0][1])
                    mouseCtx.lineTo(mousePosition[0], mousePosition[1])
                    mouseCtx.stroke()
                    mouseCtx.closePath()
                    drawPoint(state.pointsInProgress[0], mouseCtx)
                } else {
                    const [head, ...tail] = state.pointsInProgress
                    mouseCtx.beginPath()
                    setStyles({ fillStyle: `rgba(255, 0, 0, 0.4)` }, mouseCtx)
                    mouseCtx.moveTo(head[0], head[1])
                    tail.map(([x, y]) => mouseCtx.lineTo(x, y))
                    mouseCtx.lineTo(mousePosition[0], mousePosition[1])
                    mouseCtx.stroke()
                    mouseCtx.fill()
                    mouseCtx.closePath()
                    resetStyles(mouseCtx)
                    state.pointsInProgress.forEach(p => drawPoint(p, mouseCtx))
                }
            }

            state.pointsInProgress.forEach(p => drawPoint(p))
        }

        const getNextCoord = (
            coord: number[],
            selected: LocisState['selectedPoint'],
            snap: Snap,
        ) => {
            if (selected != null) {
                if (coord[0] === selected[0] && coord[1] === selected[1]) {
                    return snap.coord
                }
            }

            return coord
        }

        const drawPolyLikeGeometry = (
            polylikeGeometry: QPolyLike,
            snap: Snap,
            color = 'rgba(0,255,0,0.5)',
            context = ctx,
        ): QPolyLike => {
            const state = store.getState()
            setStyles({ fillStyle: color }, context)
            console.log(polylikeGeometry)
            // @ts-ignore
            const nextPolyLike = utils.mapPolyLike(geometry => {
                const polygonsSets =
                    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
                let didChange = false

                let finalPolygonSets = polygonsSets
                if (snap.type === 'L') {
                    finalPolygonSets = polygonsSets.map(rings =>
                        rings.map(ring => {
                            const result = utils.injectLineSnapPosition(ring, snap.line, snap.coord)

                            if (result.didInject) {
                                console.log('Injected')
                                didChange = true
                                return result.ring
                            }

                            return ring
                        }),
                    )
                }

                const nextPolygonsSets = finalPolygonSets.map(polygonSet => {
                    const [outerRing, ...holes] = polygonSet

                    const [head, ...tail] = outerRing.map(xy => {
                        if (!didChange) {
                            const nextCoord = getNextCoord(xy, state.selectedPoint, snap)

                            if (nextCoord !== xy) {
                                didChange = true
                            }

                            return nextCoord
                        }

                        return getNextCoord(xy, state.selectedPoint, snap)
                    })

                    context.beginPath()

                    context.moveTo(head[0], head[1])

                    tail.forEach(xy => {
                        context.lineTo(xy[0], xy[1])
                    })

                    context.closePath()

                    const nextHoles = holes.map(hole => {
                        const [holeHead, ...holeTail] = hole.map(xy => {
                            if (!didChange) {
                                const nextCoord = getNextCoord(xy, state.selectedPoint, snap)

                                if (nextCoord !== xy) {
                                    didChange = true
                                }

                                return nextCoord
                            }

                            return getNextCoord(xy, state.selectedPoint, snap)
                        })

                        context.moveTo(holeHead[0], holeHead[1])

                        holeTail.forEach(([x, y]) => {
                            context.lineTo(x, y)
                        })

                        context.closePath()

                        return [holeHead, ...holeTail]
                    })

                    context.fill()
                    context.stroke()

                    if (didChange) {
                        return [[head, ...tail], ...nextHoles]
                    }

                    return polygonSet
                })

                if (didChange) {
                    if (geometry.type === 'Polygon') {
                        return {
                            ...geometry,
                            coordinates: nextPolygonsSets[0],
                        }
                    }

                    return {
                        ...geometry,
                        coordinates: nextPolygonsSets,
                    }
                }

                return geometry
            })(polylikeGeometry)

            resetStyles(context)

            return nextPolyLike
        }

        const drawGeoJSON = (snap: Snap) => {
            const state = store.getState()

            return state.geoJSON.map(
                (polyItem, index): PolyItem => {
                    if (index === state.selectedIndex) {
                        const nextGeoJSON = drawPolyLikeGeometry(
                            polyItem.geoJSON,
                            snap,
                            'rgba(200,0,0,0.4)',
                        )

                        if (nextGeoJSON !== polyItem.geoJSON) {
                            return {
                                ...polyItem,
                                geoJSON: nextGeoJSON,
                                data: setGeoJson(
                                    utils.fromQLikeToPolyLike(nextGeoJSON),
                                    polyItem.data,
                                ),
                            }
                        }

                        return polyItem
                    } else {
                        const nextGeoJSON = drawPolyLikeGeometry(polyItem.geoJSON, snap)

                        if (nextGeoJSON !== polyItem.geoJSON) {
                            return {
                                ...polyItem,
                                geoJSON: nextGeoJSON,
                                data: setGeoJson(
                                    utils.fromQLikeToPolyLike(nextGeoJSON),
                                    polyItem.data,
                                ),
                            }
                        }

                        return polyItem
                    }
                },
            )
        }

        /**
         * DRAW ALL THE THINGS
         * @param data
         */
        let previousGeoJSON: LocisState['geoJSON'] = [] // store.getState().geoJSON
        let previousSelectedIndex: number | undefined
        const draw = ({ mousePosition = store.getState().lastKnownMousePosition } = {}) => {
            resetCanvas(mouseCtx)
            const state = store.getState()
            const nextGeoJSON = state.geoJSON
            let updatedGeoJSON = state.geoJSON
            const selectedIndex = state.selectedIndex
            const snapPosition = getSnapPosition(mousePosition)

            if (
                selectedIndex != null ||
                (previousSelectedIndex != null && selectedIndex == null) ||
                previousGeoJSON !== nextGeoJSON
            ) {
                previousSelectedIndex = selectedIndex
                previousGeoJSON = nextGeoJSON
                resetCanvas()
                updatedGeoJSON = drawGeoJSON(snapPosition)
            }

            if (selectedIndex != null) {
                const selectedItem = state.geoJSON[selectedIndex]

                coordEach(selectedItem.geoJSON, coord => {
                    const xy = getNextCoord(coord, state.selectedPoint, snapPosition)
                    drawMarker(xy[0], xy[1], mouseCtx)
                })
            } else {
                drawInProgressPoints(snapPosition.coord)
                drawHover(snapPosition)
            }

            drawMousePosition(snapPosition)

            return updatedGeoJSON
        }

        /**
         * Re-draw the canvas on every mouse move
         */

        const draw$ = observables.mouseMovePos$.pipe(map(mousePosition => draw({ mousePosition })))
        const subscribeToDrawOnMouseMove = () => draw$.subscribe()

        /**
         * On every mouse click, add a point to out list of points.
         * On press "Enter", add the drawn polygon to the set of polygons and restart
         */
        const drawNewPointUntilEnterKey$ = takeUntil<[number, number]>(
            observables.enterKey$.pipe(
                filter(() => store.getState().pointsInProgress.length >= 3),
                map(event => {
                    const points = store.getState().pointsInProgress
                    // polygons.push([...points])
                    // points.splice(0, points.length)
                    // updatePointsDb()
                    // draw()
                    // subscribeAddNewPolyItem()

                    const data = points.map(
                        // @ts-ignore
                        ([px, py, cx, cy]) => {
                            if (cx && cy) {
                                return [cx, cy]
                            }

                            return toLngLat([px, py])
                        },
                    )

                    const polyitem: PolyItem = {
                        id: _.uniqueId(),
                        index: store.getState().geoJSON.length,
                        data: {
                            type: 'Polygon',
                            coordinates: [[...data, data[0]]],
                        },
                        geoJSON: {
                            type: 'Polygon',
                            coordinates: [[...points, points[0]]],
                        },
                    }

                    // polygons.splice(0, polygons.length)
                    store.dispatch(actionCreators.add(polyitem))
                    return event
                }),
            ),
        )

        const subscribeAddNewPolyItem = () =>
            observables
                .mapToUpPosFromEither(drawNewPointUntilEnterKey$)
                .subscribe(mousePosition => {
                    const nextPoint = getSnapPosition(mousePosition).coord
                    store.dispatch(actionCreators.addPointInProgress(nextPoint))
                    draw({ mousePosition })
                    updatePointsDb()
                })

        const subscribeSelectPolyItem = () =>
            observables.mouseClickPos$
                .pipe(
                    map(coord => {
                        if (store.getState().drawing === true) {
                            return undefined
                        }

                        const items = polyDb.searchByPoint(coord)
                        if (items.length > 0) {
                            const selectedIndex = _.findIndex(
                                store.getState().geoJSON,
                                polyItem => polyItem.id === items[0].id,
                            )
                            if (selectedIndex != null) {
                                return selectedIndex
                            }
                        }
                        return
                    }),
                    filter(
                        (selectedIndex): selectedIndex is NonNullable<number> =>
                            selectedIndex != null,
                    ),
                    take(1),
                )
                .subscribe(selectedIndex => {
                    store.dispatch(actionCreators.select(selectedIndex))
                    draw()
                    subscribeSelectPoint()
                })

        const subscribeSelectPoint = () =>
            observables.mouseDownPos$
                .pipe(
                    map(coord => {
                        const snap = getSnapPosition(coord)
                        const state = store.getState()
                        const polyItem = state.geoJSON[state.selectedIndex!]
                        const coords = coordAll(polyItem.geoJSON)

                        const match = coords.find(
                            ([x, y]) => x === snap.coord[0] && y === snap.coord[1],
                        )

                        if (match) {
                            return snap.coord
                        }

                        return
                    }),
                    filter((coord): coord is NonNullable<typeof coord> => coord != null),
                    take(1),
                )
                .subscribe(coord => {
                    store.dispatch(actionCreators.selectPoint(coord))
                    subscribeDeselectPoint()
                })

        const subscribeDeselectPoint = () =>
            draw$
                .pipe(
                    takeUntil(observables.mouseUp$),
                    switchMap(polyItems => {
                        return observables.mouseUp$.pipe(
                            map(() => {
                                store.dispatch(actionCreators.selectPoint(undefined))
                                store.dispatch(actionCreators.select(undefined))
                                // draw()
                                setTimeout(subscribeSelectPolyItem, 0)

                                return polyItems
                            }),
                            take(1),
                        )
                    }),
                )
                .subscribe(polyItems => {
                    if (polyItems !== store.getState().geoJSON) {
                        load(polyItems.map(item => item.data))
                    }
                })

        subscribeToDrawOnMouseMove()
        // subscribeSelectPolyItem()
        subscribeAddNewPolyItem()

        return {
            draw,
            load,
            store,
            drawPolygon: () => store.dispatch(actionCreators.drawPolygon()),
        }
    }

    return
}
