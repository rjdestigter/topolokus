import bbox from '@turf/bbox'
import * as _ from 'lodash'

// @ts-ignore
import RbushClass from 'rbush/index'

import { Polygon, Point } from './types'

import boundingBox from './utils/bbox'
import booleanPointInPolygon from './utils/booleanPointInPolygon'

type RBush<T = {}> = new (...args: any) => rbush.RBush<T>

const RBush: RBush = RbushClass

const polygonToItem = (polygon: Polygon, index: number) =>
    Object.assign(boundingBox(polygon), { polygon, index })

type Item = ReturnType<typeof polygonToItem>
type Tree = rbush.RBush<Item>

const insertPolygons = (tree: Tree, state: { count: number }) => (polygons: Polygon[]) => {
    console.log(`Count: ${state.count}`)
    const items = polygons.map((polygon, index) => {
        console.info(index, state.count, index + state.count + 1)
        return polygonToItem(polygon, index + state.count + 1)
    })
    state.count += polygons.length
    console.warn(`Inserting ${items.length}`)
    tree.load(items)
}

const insertPolgyon = (tree: rbush.RBush<Item>, state: { count: number }) => (polygon: Polygon) => {
    state.count += 1
    tree.insert(polygonToItem(polygon, state.count))
}

const searchByBoundingBox = (tree: Tree) => (boundingBox: rbush.BBox) => tree.search(boundingBox) // .map(item => item.polygon)

const searchByPoint = (tree: Tree) => {
    const search = searchByBoundingBox(tree)

    return ([x, y]: Point) => {
        const items = search({
            minX: x,
            minY: y,
            maxX: x,
            maxY: y,
        })

        // items.length > 0 && console.log(items)
        return items.filter(item => booleanPointInPolygon([x, y], item.polygon))
    }
}

export default (...initialPolygons: Polygon[]) => {
    const tree: rbush.RBush<Item> = new RBush() as any
    Object.assign(window, { tree })
    const state = { count: -1 }

    const insert = insertPolygons(tree, state)
    const search = searchByBoundingBox(tree)
    const searchPoint = searchByPoint(tree)

    const replace = (polygons: Polygon[]) => {
        state.count = -1
        tree.clear()
        insert(polygons)
    }
    insert(initialPolygons)

    return {
        insert,
        search,
        searchPoint,
        replace,
    }
}
