import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import turf from 'turf';
import trashIcon from './img/garbage.svg';
import boxIcon from './img/box.svg';
import circleIcon from './img/circle.svg';
import polyIcon from './img/polygon.svg';



mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;
let map;

// TODO: change document title

class Map extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lng: 36.81667,
            lat: -1.28333,
            zoom: 10,
            lineCoordinates: [],
            plotCoordinates: [],
            boundingBoxCoordinates: null,
            circleCoordinates: null,
            polygonCoordinates: null,
            type: null,            
        }
    }

    componentDidMount() {
        document.title = 'Draw on a Map'; 
         map = new mapboxgl.Map({
            container: document.getElementById('map'),
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [this.state.lng, this.state.lat],
            zoom: this.state.zoom
            });
            document.title = 'Draw on a Map';        
    }

    setDrawingMode = (type) => {        
        this.setState({  type });
        map.on('click', this.setCoordinates);
    }
    
    clickHandler = ({ currentTarget: { id } }) => {
        const { type } = this.state;        
        if(!type) {
            this.setDrawingMode(id);
        } else if( type === id ) {            
            this[type]();
        }               
    }

    plot = (coordinates) => {        
        if(!map.getLayer('plotLayer')) {
            this.draw('MultiPoint', coordinates, 'plotLayer', 'circle', {'circle-color': '#002080',
            'circle-radius': 5});       
        } else {
            map.removeLayer('plotLayer');
            map.removeSource('plotLayer');
            this.draw('MultiPoint', coordinates, 'plotLayer', 'circle', {'circle-color': '#002080',
            'circle-radius': 5});
        }       
    } 

    setCoordinates = (e) => {        
        map.getCanvas().style.cursor = 'crosshair';
        const coordinates = e.lngLat;
        this.setState(state => {            
            const plotCoordinates = state.plotCoordinates.concat([[coordinates.lng, coordinates.lat]]);
            return { plotCoordinates };
        });         
        this.plot(this.state.plotCoordinates);             
    }

    Polygon = () => {        
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
                    { 'fill-color': '#3366ff', 'fill-opacity': .5, 'fill-outline-color': '#002080' }
                    );
            });             
            map.off('click', this.setCoordinates);    
            }   
        }
      
     Circle = () => {
         const { plotCoordinates, type } = this.state;    
         if(plotCoordinates.length === 2 && type === 'Circle' && !map.getLayer('circleLayer')) {
            const radius = turf.distance(plotCoordinates[0], plotCoordinates[1], 'kilometers') * 1000;
            const metersToPixelsAtMaxZoom = (meters, latitude) => meters / 0.075 / Math.cos(latitude * Math.PI / 180);
            const circleCoordinates = { center: plotCoordinates[0], radius };
            this.setState({ circleCoordinates }, () => {
                const { circleCoordinates } = this.state;
                this.draw(
                    'Point',
                    circleCoordinates.center,
                    'circleLayer',
                    'circle',
                    {   'circle-color':'#3366ff',
                        'circle-opacity': .5,
                        'circle-stroke-color': '#002080',  
                        'circle-radius': {
                                            stops: [[0, 0], [20, metersToPixelsAtMaxZoom(circleCoordinates.radius, circleCoordinates.center[1])]], base: 2
                                        }
                    }
                );
            }); 
             map.off('click', this.setCoordinates);          
         }             
          
     }

     BoundingBox = () => {
         const { plotCoordinates, type } = this.state;  
         if(plotCoordinates.length === 2 && type === 'BoundingBox' && !map.getLayer('boundingBoxLayer')) {  
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
                    {'fill-color':'#3366ff', 'fill-opacity': .5, 'fill-outline-color': '#002080' }
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
        map.off('click', this.setCoordinates);
    }

     infoText = {
         Circle: 'Click on a point on the map to set the center, then click on another point to set the radius. Click on the Circle Tool button again to complete. Requires only two Points. Use the Clear button to reset the tools.',
         BoundingBox: 'Click on two points on the map to set the corner edges of the bounding box and then click the Polygon tool again to close the shape. Requires only two Points. Use the Clear button to reset the tools.',
         Polygon: 'Click on the map to set polygon points and then click the Polygon Tool again to close the shape. Use the Clear button to reset the tools.',
         null: 'Click on a tool to set the drawing mode.'
     }

   render() {
       const { type, boundingBoxCoordinates, circleCoordinates, polygonCoordinates, dr } = this.state;
        return (
            <div className='wrapper'>
                <div className='header'></div>
                <div className='main'>
                    <div className='grid'>                
                    <div className='map-style' id='map' />
                    <div className="tools">
                    <h4 className="tools-heading">Tools:</h4>
                        <div className='drawing-controls'>                            
                            <button className={type === 'Circle' ? 'active' : ''} onClick={this.clickHandler} id="Circle"><span><img src={circleIcon} alt="circle-icon"/></span></button>
                        
                            <button className={type === 'Polygon' ? 'active' : ''} onClick={this.clickHandler} id="Polygon"><span><img src={polyIcon} alt="polygon-icon"/></span></button>
                            
                            <button className={type === 'BoundingBox' ? 'active' : ''} onClick={this.clickHandler} id="BoundingBox"><span><img src={boxIcon} alt="boxIcon"/></span></button>
                            
                            <button onClick={this.clear} id="clear"><span><img src={trashIcon} alt="clear-icon"/></span></button>
                        </div>
                    </div>
                    <div className='info'>                        
                        <div className='info-box'>                        
                            <h5 className="info-heading">Drawing Mode: </h5>
                              <p className="info-text"><code>{type}</code></p>      
                        </div>
                        <div className="info-box">
                            <h5 className="info-heading">Info:</h5>
                            <p className="info-text"><code >{this.infoText[type]}</code></p>
                        </div>
                        <div className='info-box'>
                        <h5 className="info-heading">Coordinates:</h5>

                            { circleCoordinates  ?
                            <div className="info-text">
                                <p>{JSON.stringify({circleCoordinates}, null,  4)}</p>  
                            </div>       
                            : null}

                            { boundingBoxCoordinates  ?
                            <div className="info-text">
                                <p>{JSON.stringify({boundingBoxCoordinates}, null,  4)}</p>  
                            </div>       
                            : null}

                            { polygonCoordinates  ?
                            <div className="info-text">
                                <p>{JSON.stringify({polygonCoordinates}, null,  4)}</p>  
                            </div>       
                            : null}

                        </div>
                        
                    </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Map;