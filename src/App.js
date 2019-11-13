import React from 'react';
import Map from './Map';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

function App() {
  return (
    <div className="App">
      <div>
        <Map />
      </div>
    </div>
  );
}

export default App;
