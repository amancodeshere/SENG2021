import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import worldMap from "../../data/world-100m.json"
import "../css/WorldMap.css"

export default function WorldMap() {
  return (
    <div className="map-container">
      <ComposableMap 
        projection="geoMercator"
        projectionConfig={{
          scale: 147,
          center: [0, 0]
        }}
        style={{ width: "100%", height: "600px" }}
      >
        <Geographies geography={worldMap}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: "#D6D6DA",
                    outline: "none",
                  },
                  hover: {
                    fill: "#F53",
                    outline: "none",
                  },
                  pressed: {
                    fill: "#E42",
                    outline: "none",
                  },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
    </div>
  )
}
