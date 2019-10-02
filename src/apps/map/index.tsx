import '../../leaflet/leaflet.css'

import React from 'react'
import { Map, TileLayer, useLeaflet, Pane } from 'react-leaflet'
import _ from 'lodash'
import { FeatureCollection, Polygon, MultiPolygon } from '@turf/helpers'

// Plop
import plopLeaflet from '../../modules/leaflet/src'

// Data
import geojson from '../../data/nl.json'

const Canvas = () => {
    const context = useLeaflet()
    const [data, setData] = React.useState<FeatureCollection<Polygon | MultiPolygon>>(
        geojson as any,
    )

    React.useEffect(() => {
        if (context.map != null) {
            const plop = plopLeaflet(context.map, { pane: context.pane })([data])

            // plop.observables.

            return plop.unsubscribe
        }
    }, [
        context.map,
        // context.map && context.map.getCenter().lat,
        // context.map && context.map.getCenter().lng,
    ])

    return null
}

const tileLayer = (
    <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    />
)

export default () => {
    const [position] = React.useState([52.1326, 5.2913] as [number, number])

    return (
        <Map center={position} zoom={8}>
            {tileLayer}
            <Pane name="plop-canvas">
                <Canvas />
            </Pane>
        </Map>
    )
}
