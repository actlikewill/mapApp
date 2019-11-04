import React, {useState} from 'react';
import ReactMapGL, {SVGOverlay} from 'react-map-gl';

function hoverHandler(e) {
  console.log(e.lngLat);
}

function redraw(obj) {
  console.log(this);
  // const [cx, cy] = project([-122, 37]);
  // return <circle cx={cx} cy={cy} r={40} fill="blue" />;
}

function App() {
  const [viewport, setViewport] = useState({
    latitude: 1.286386,
    longitude: 36.817223,
    width: '100vw',
    height: '100vh',
    zoom: 10
  });
  return (
    <div className="App">
      <ReactMapGL 
        {...viewport}
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        onViewportChange={viewport => {setViewport(viewport)}}
        onClick={hoverHandler}
        mapStyle="mapbox://styles/actlikewill/ck2g3scvn0pjs1cpg5r7xshds"
        >
        <SVGOverlay redraw={redraw} />
      </ReactMapGL>
      <div>
        hellow
      </div>
    </div>
  );
}

export default App;
