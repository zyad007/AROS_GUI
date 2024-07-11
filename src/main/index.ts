import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createConnection, Socket } from 'net';
import { readFileSync } from 'fs';
import { ReadlineParser, SerialPort } from 'serialport';


const IMAGE_PATH = `/tmp/detected_pics/`;

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

  const serialPort = new SerialPort({ path: '/dev/ttyAMA0', baudRate: 9600, parity: 'none', stopBits: 1, dataBits: 8 }) // '/dev/ttyAMA0' for Pi 3
  serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }))

  serialPort.on('data', (data) => {
    console.log(data);
    mainWindow.webContents.send('v2v_receive', data)
  })
  const modelClient = new Socket();

  modelClient.connect({ port: 12345, host: '127.0.0.1' }, () => {
    console.log('Connected to Model');
  })

  modelClient.on('data', (data) => {

    if(data.toString() === '{}') return;

    const obstacles = JSON.parse(data.toString());
    const imageId = obstacles.shift();

    obstacles.forEach(obstacle => {

      if (obstacle.class !== 'D50') return;

      try {
        // Warn User
        mainWindow.webContents.send('obstacle_detected', {
          class: obstacle.class,
          score: obstacle.score,
          box: obstacle.box,
          imagePath: readFileSync(IMAGE_PATH + `frame${imageId}`)
        })
        // Warn V2V
        serialPort.write(JSON.stringify({
          class: obstacle.class,
          score: obstacle.score,
        }) + '\n', 'utf-8');
        // Send Server

        console.log(obstacle);
      }

      catch (e) {
        console.log(e);
      }

    })

  })


  let long = 31.234049;
  let lat = 30.050363;

  mainWindow.webContents.send('gps', {
    long,
    lat
  })

  // setInterval(() => {
  //   lat += 0.00001;
  //   mainWindow.webContents.send('obstacle_detected', {
  //     imagePath: readFileSync('C:\\Users\\Zyad\\Desktop\\AROS.png')
  //   })
  //   mainWindow.webContents.send('gps', {
  //     long,
  //     lat
  //   })
  // }, 3000)

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
