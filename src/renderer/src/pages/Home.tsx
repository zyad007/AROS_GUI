import { useEffect, useRef, useState } from 'react'
import Map, { MapRef, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import ObstacleModal from '@renderer/components/ObstacleModal';

const MAPTILER = 'https://api.maptiler.com/maps/streets/style.json?key=ZFtcxc8UpIJArb56xQlZ';


export default function Home() {
    const [long, setLong] = useState(0);
    const [lat, setLat] = useState(0);

    
    const mapRef = useRef<MapRef>(null);
    
    const [screenLock, setScreenLock] = useState(true);
    
    const [isOpen, setIsOpen] = useState(false);
    const [img, setImg] = useState('');
    const [_class, setClass] = useState('');
    const [score, setScore] = useState(0);
    const [box, setBox] = useState([]);

    useEffect(() => {
        window.electron.ipcRenderer.on('gps', (_, res) => {
            setLong(res.lng);
            setLat(res.lat);
        })

        window.electron.ipcRenderer.on('obstacle_detected', (_, res) => {
            console.log(res);
            setImg(`data:image/png;base64,${btoa(res.imagePath.reduce((data, byte) => data + String.fromCharCode(byte), ''))}`)
            setIsOpen(true)
        })

        window.electron.ipcRenderer.on('v2v_receive', (_, res) => {
            console.log('V2V Recived');
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
            mapRef.current?.flyTo({ center: [long, lat], duration: 500 })
            mapRef.current?.rotateTo(0)
        }

        setScreenLock(!screenLock);
    }

    return (
        <>
            <ObstacleModal isOpen={isOpen} setIsOpen={setIsOpen} score={score} _class={_class} box={box} img={img}/>
            <div className='relative w-full h-full'>
                <div className='absolute top-0 left-0'>
                    <div className='flex justify-center items-center bg-slate-500 w-24 h-24 rounded-full absolute top-5 left-5 z-10 p-3' onClick={handleScreenLock}>
                        {
                            screenLock ?
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 14.5V16.5M7 10.0288C7.47142 10 8.05259 10 8.8 10H15.2C15.9474 10 16.5286 10 17 10.0288M7 10.0288C6.41168 10.0647 5.99429 10.1455 5.63803 10.327C5.07354 10.6146 4.6146 11.0735 4.32698 11.638C4 12.2798 4 13.1198 4 14.8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V14.8C20 13.1198 20 12.2798 19.673 11.638C19.3854 11.0735 18.9265 10.6146 18.362 10.327C18.0057 10.1455 17.5883 10.0647 17 10.0288M7 10.0288V8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V10.0288" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                                :
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 3L21 21M17 10V8C17 5.23858 14.7614 3 12 3C11.0283 3 10.1213 3.27719 9.35386 3.75681M7.08383 7.08338C7.02878 7.38053 7 7.6869 7 8V10.0288M19.5614 19.5618C19.273 20.0348 18.8583 20.4201 18.362 20.673C17.7202 21 16.8802 21 15.2 21H8.8C7.11984 21 6.27976 21 5.63803 20.673C5.07354 20.3854 4.6146 19.9265 4.32698 19.362C4 18.7202 4 17.8802 4 16.2V14.8C4 13.1198 4 12.2798 4.32698 11.638C4.6146 11.0735 5.07354 10.6146 5.63803 10.327C5.99429 10.1455 6.41168 10.0647 7 10.0288M19.9998 14.4023C19.9978 12.9831 19.9731 12.227 19.673 11.638C19.3854 11.0735 18.9265 10.6146 18.362 10.327C17.773 10.0269 17.0169 10.0022 15.5977 10.0002M10 10H8.8C8.05259 10 7.47142 10 7 10.0288" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                        }

                    </div>
                </div>

                <div className='w-full h-full'>
                    <Map
                        ref={mapRef}
                        initialViewState={{
                            longitude: 0,
                            latitude: 0,
                            zoom: 18,
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
        </>
    );
}
