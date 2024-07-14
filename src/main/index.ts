import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createConnection, Socket } from 'net';
import { readFileSync } from 'fs';
import { ReadlineParser, SerialPort } from 'serialport';
// import fetch from 'node-fetch';
import FormData from 'form-data';
import axios from 'axios';


const IMAGE_PATH = `/home/Omar/Pictures/AROS/`;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    fullscreen: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  const mainWindow = createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // CODE START
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////// 

  //////////////////
  // Send GPS LATLNG
  //////////////////
  let lat = 29.851030;
  let lng = 31.341496;

  setInterval(() => {
    mainWindow.webContents.send('gps', {
      lat,
      lng
    })
  }, 500)

  // setInterval(() => {
  //   lat += 0.00001;
  //   mainWindow.webContents.send('obstacle_detected', {
  //     // imagePath: readFileSync('C:\\Users\\Zyad\\Desktop\\AROS.png')
  //   })
  //   mainWindow.webContents.send('gps', {
  //     lng,
  //     lat
  //   })
  // }, 3000)


  ///////////////////
  // INIT SERIAL PORT
  ///////////////////
  const serialPort = new SerialPort({ path: '/dev/ttyAMA0', baudRate: 9600, parity: 'none', stopBits: 1, dataBits: 8 }) // '/dev/ttyAMA0' for Pi 3
  serialPort.write('Init GUI', 'utf-8')

  serialPort.on('data', (data) => {
    console.log(data);
    mainWindow.webContents.send('v2v_receive', data)
  })

  ////////////////////
  // INIT MODEL SOCKET
  ////////////////////
  const modelClient = new Socket();

  modelClient.connect({ port: 12345, host: '127.0.0.1' }, () => {
    console.log('Connected to Model');
  })


  modelClient.on('data', (data) => {
    if (data.toString() === '{}') return;

    const obstacles = JSON.parse(data.toString());
    const imageId = obstacles.shift();

    obstacles.forEach(obstacle => {

      let image;

      if (obstacle.class !== 'D50' && obstacle.class !== 'D40' && obstacle.class !== 'D20' && obstacle.class !== 'accident') return;

      console.log('DETECTED ' + obstacle.class);
      /////////////
      // Read Image
      /////////////
      try {
        image = readFileSync(IMAGE_PATH + `frame_${imageId}.jpg`)
      }
      catch {
        console.log('error image')
      }

      ////////////
      // Warn User
      ////////////
      try {
        mainWindow.webContents.send('obstacle_detected', {
          class: obstacle.class,
          score: obstacle.score,
          box: obstacle.box,
          imagePath: image
        })
        // Warn V2V
        serialPort.write(JSON.stringify({
          class: obstacle.class,
          score: obstacle.score,
        }) + '\n', 'utf-8');
        console.log(obstacle);
      }
      catch (e) {
        console.log(e);
      }


      /////////////////
      // Send To Server
      /////////////////
      try {
        let imageUrl = '';
        const formData = new FormData();
        formData.append('file', image);
        axios({
          method: 'post',
          url: 'https://az-managment-server.onrender.com/upload',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
          .then((res) => {
            console.log(res.data.message);
            imageUrl = res.data.message;
          })
          .catch(e => {
            console.log(e);
          })

        fetch('https://aros-server-new.onrender.com/obstacle/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: 2,
            lat: lat,
            lng: lng,
            type: obstacle.class,
            regionId: 3,
            imageUrl: imageUrl
          })
        })
          .then(res => {
            if (res.ok) {
              console.log('CREATED');
            }
          })
          .catch(e => {
            console.log(e);
          })
      }

      catch (e) {
        console.log('SERVER');
      }

    })

    // // Warn User
    // let imag;

    // try {
    //   imag = readFileSync(IMAGE_PATH + `frame_${imageId}.jpg`)
    // }
    // catch(e) {
    //   console.log(e)
    // }
    // mainWindow.webContents.send('obstacle_detected', {
    //   class: obstacle[0]?.class,
    //   score: obstacle[0]?.score,
    //   box: obstacle.box,
    //   imagePath: imag
    // })
    // // Warn V2V
    // serialPort.write( JSON.stringify({
    //   class: obstacle[0]?.class,
    //   score: obstacle[0]?.score,
    // }) + '\n', 'utf-8')
    // // Send Server


    // console.log(obstacle);
    // try {
    //   const img = readFileSync(IMAGE_PATH + `frame${imageId}`)
    // } catch (e) {
    //   console.log(e);
    // }
  })
  




})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
