import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import turf from 'turf';


//  TODO: set page title


mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
let map;


class Map extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lng: 36.81667,
            lat: -1.28333,
            zoom: 15,
            lineCoordinates: [],
            plotCoordinates: [],
            boundingBoxCoordinates: null,
            circleCoordinates: null,
            polygonCoordinates: null,
            type: null,            
        }
    }

    componentDidMount() {
         map = new mapboxgl.Map({
            container: document.getElementById('map'),
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [this.state.lng, this.state.lat],
            zoom: this.state.zoom
            });        
    }

    setDrawingMode = (type) => {
        this.setState({ type });
        map.on('click', this.setCoordinates);
    }
    
    clickHandler = ({ target: { id } }) => {
        this.setDrawingMode(id);
    }

    plot = (coordinates) => {        
        if(!map.getLayer('plotLayer')) {
            this.draw('MultiPoint', coordinates, 'plotLayer', 'circle', {'circle-color': '#888',
            'circle-radius': 5});       
        } else {
            map.removeLayer('plotLayer');
            map.removeSource('plotLayer');
            this.draw('MultiPoint', coordinates, 'plotLayer', 'circle', {'circle-color': '#888',
            'circle-radius': 5});
        }       
    } 

    setCoordinates = (e) => {
        // TODO: Change cursor when this handler is active
        
        const coordinates = e.lngLat;
        this.setState(state => {            
            const plotCoordinates = state.plotCoordinates.concat([[coordinates.lng, coordinates.lat]]);
            return { plotCoordinates };
        });         
        this.plot(this.state.plotCoordinates);             
    }

    closePolygon = () => {        
        const { plotCoordinates, type } = this.state;        
        if (plotCoordinates.length > 2 && type === 'Polygon' && !map.getLayer('polygonLayer')) {
            const firstPoint = plotCoordinates[0];
            const polygonCoordinates = [[...plotCoordinates, [...firstPoint]]];
            this.setState({ polygonCoordinates }, () => {
                const { polygonCoordinates } = this.state;
                this.draw(
                    type,
                    polygonCoordinates,
                    'polygonLayer',
                    'fill',
                    {   'fill-color': '#ddd' }
                    );
            });            
            map.off('click', this.setCoordinates);    
            }   
        }
      
     closeCircle = () => {
         const { plotCoordinates, type } = this.state;    
         if(plotCoordinates.length === 2 && type === 'Point' && !map.getLayer('circleLayer')) {
            const distance = turf.distance(plotCoordinates[0], plotCoordinates[1], 'kilometers') * 1000;
            const metersToPixelsAtMaxZoom = (meters, latitude) => meters / 0.075 / Math.cos(latitude * Math.PI / 180);
            const circleCoordinates = { center: plotCoordinates[0], distance };
            this.setState({ circleCoordinates }, () => {
                const { circleCoordinates } = this.state;
                this.draw(
                    type,
                    circleCoordinates.center,
                    'circleLayer',
                    'circle',
                    {   'circle-color':'#ddd',
                        'circle-radius': {
                                            stops: [[0, 0], [20, metersToPixelsAtMaxZoom(circleCoordinates.distance, circleCoordinates.center[1])]], base: 2
                                        }
                    }
                );
            });            
         }             
         map.off('click', this.setCoordinates); 
     }

     closeBoundingBox = () => {
         const { plotCoordinates, type } = this.state;  
         if(plotCoordinates.length === 2 && type === 'boundingBox' && !map.getLayer('boundingBoxLayer')) {  
            const mirroredPoint1 = [plotCoordinates[1][0], plotCoordinates[0][1]]; 
            const mirroredPoint2 = [plotCoordinates[0][0], plotCoordinates[1][1]];
            const boundingBoxCoordinates = plotCoordinates.slice();
            boundingBoxCoordinates.splice(1, 0, mirroredPoint1);
            boundingBoxCoordinates.splice(3, 0, mirroredPoint2);
            this.setState({ boundingBoxCoordinates }, () => {   
                const { boundingBoxCoordinates } = this.state;         
                this.plot(boundingBoxCoordinates);
                this.draw(
                    'Polygon',
                    [boundingBoxCoordinates],
                    'boundingBoxLayer',
                    'fill',
                    {   'fill-color':'#ddd' }
                    );
                }); 
            map.off('click', this.setCoordinates);
         }
     }       

    draw = (type, coordinates, layerName, layerType, paint) => {
           map.addLayer({
            'id': layerName,
            'type': layerType,
            'source': {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry' : {
                        'type': type,
                        'coordinates': coordinates
                    }
                }
            },
            'layout': {},
            'paint': paint
        });
    }


    clear = () => {
        const layerNames = ['plotLayer', 'polygonLayer', 'circleLayer', 'boundingBoxLayer'];
        layerNames.map(layer => {
            if(map.getLayer(layer)) {
                map.removeLayer(layer);
                map.removeSource(layer);
            }
        });       
        this.setState(() => {
            return {
                plotCoordinates: [],
                boundingBoxCoordinates: null,
                circleCoordinates: null,
                polygonCoordinates: null,
                type: null,
            }
        });
    }

   render() {
        return (
            <>
                <div className='map-style' id='map' />
                <div className='drawing-controls'>
                    <button onClick={this.clickHandler} id="Point">Circle</button>
                    <button onClick={this.clickHandler} id="Polygon">Polygon</button>
                    <button onClick={this.clickHandler} id="boundingBox">Bounding Box</button>
                    <button onClick={this.closePolygon} id="closePolygon">Close Polygon</button>
                    <button onClick={this.closeCircle} id="closeCircle">Close Circle</button>
                    <button onClick={this.closeBoundingBox} id="closeBoundingBox">Close Bounding Box</button>
                    <button onClick={this.clear} id="clear">Clear</button>
                </div>
            </>
        );
    }
}

export default Map;