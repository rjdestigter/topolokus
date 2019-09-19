import bbox from '@turf/bbox'
import * as _ from 'lodash'

// @ts-ignore
import RbushClass from 'rbush/index'

import turfBooleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { Feature, FeatureCollection, MultiPolygon, Polygon } from '@turf/helpers'
import { geomEach } from '@turf/meta'

import {
    PolyItem,
    PolyLike,
    QFeature,
    QFeatureCollection,
    QMultiPolygon,
    QPolygon,
    QPolyLike,
} from './types'

type RBush<T = {}> = new (...args: any) => rbush.RBush<T>

const RBush: RBush = RbushClass

interface Data {
    minX: number
    minY: number
    maxX: number
    maxY: number
    item: PolyItem
}

export default function createPolyBush(...initialItems: PolyItem[]) {
    const tree = new RBush(10)

    let map: {
        [itemId: string]: PolyItem
    } = {}

    let itemsMap: {
        [itemId: string]: { item: PolyItem; minX: number; minY: number; maxX: number; maxY: number }
    } = {}

    insert(...initialItems)

    function refresh(...items: PolyItem[]) {
        const current = _.values(map)
        const toBeRemoved = _.difference(current, items)
        const toBeAdded = _.difference(items, current)

        remove(...toBeRemoved)
        insert(...toBeAdded)
    }

    function add(...items: PolyItem[]) {
        remove(...items)
        insert(...items)
    }

    function insert(...items: PolyItem[]) {
        Object.assign(map, _.keyBy(items, 'id'))

        const data = items.reduce(
            (acc, item) => {
                const [minX, minY, maxX, maxY] = bbox(item.geoJSON)
                itemsMap[item.id] = {
                    minX,
                    minY,
                    maxX,
                    maxY,
                    item,
                }

                acc.push(itemsMap[item.id])

                return acc
            },
            [] as Data[],
        )

        tree.load(data)
    }

    function remove(...items: PolyItem[]) {
        items.forEach(item => {
            // @ts-ignore
            tree.remove(itemsMap[item.id], (a, b) => b.item.id === a.item.id)
            delete map[item.id]
        })
    }

    function removeById(...ids: string[]) {
        ids.forEach(id => {
            // @ts-ignore
            tree.remove(itemsMap[id], (a, b) => b.item.id === a.item.id)
            delete map[id]
        })
    }

    function clear() {
        map = {}
        itemsMap = {}
        tree.clear()
    }

    function reset(...features: PolyItem[]) {
        clear()
        add(...features)
    }

    function search(boundingBox: rbush.BBox) {
        if (tree) {
            // @ts-ignore
            return _.map(tree.search(boundingBox), ({ item }) => item)
        }

        return []
    }

    function searchByPoint([x, y]: [number, number, ...number[]]) {
        const polyItems = search({
            minX: x,
            minY: y,
            maxX: x,
            maxY: y,
        })

        return polyItems.filter(item => {
            let isHovering = false
            geomEach(item.geoJSON, geometry => {
                isHovering = isHovering || turfBooleanPointInPolygon([x, y], geometry)
            })

            return isHovering
        })
    }

    function getData() {
        return map
    }

    return {
        add,
        remove,
        removeById,
        refresh,
        insert,
        clear,
        reset,
        search,
        searchByPoint,
        getData,
    }
}

export type PolyBush = ReturnType<typeof createPolyBush>
