import { useEffect, useRef, useState } from 'react'
import Map, { MapRef, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER = 'https://api.maptiler.com/maps/streets/style.json?key=ZFtcxc8UpIJArb56xQlZ';


export default function Home() {
    const [long, setLong] = useState(31.234049);
    const [lat, setLat] = useState(30.050363);

    const mapRef = useRef<MapRef>(null);

    const [screenLock, setScreenLock] = useState(true);

    useEffect(() => {
        window.electron.ipcRenderer.on('gps', (_, res) => {
            setLong(res.long);
            setLat(res.lat);
        })
    }, [])

    useEffect(() => {
        if (screenLock) {
            mapRef.current?.easeTo({ center: [long, lat], duration: 2000 });
        }
        console.log(long, lat);
    }, [lat])

    const handleScreenLock = () => {
        if (!screenLock) {
            mapRef.current?.flyTo({ center: [long, lat], duration: 1000 })
            mapRef.current?.rotateTo(0)
        }

        setScreenLock(!screenLock);
    }

    return (
        <div className='relative w-full h-full'>

            <div className='bg-slate-100 absolute top-0 left-0 z-10' onClick={() => { setLat(lat + 0.00001) }}>
                Up
            </div>

            <div className='bg-slate-100 absolute top-10 left-0 z-10' onClick={handleScreenLock}>
                Lock
            </div>

            <div className='w-full h-full'>
                <Map
                    ref={mapRef}
                    initialViewState={{
                        longitude: 0,
                        latitude: 0,
                        zoom: 16,
                        bearing: 0
                    }}
                    dragPan={!screenLock}
                    doubleClickZoom={false}
                    dragRotate={!screenLock}
                    mapStyle={MAPTILER}
                    onTouchMove={() => { setScreenLock(!screenLock) }}
                >

                    <Marker latitude={lat} longitude={long} draggable={true}>
                        <div className='bg-blue-600 w-5 h-5 rounded-full flex justify-center items-center'>
                            <div className='border-2 border-white w-[80%] h-[80%] rounded-full'>
                            </div>
                        </div>
                    </Marker>

                </Map>
            </div>
        </div>
    );
}
