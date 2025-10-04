import {app , BrowserWindow, ipcMain} from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import {DeviceService} from '../backend/service/deviceService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const createWindow = ()=>{
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences:{
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
        }
    })

    win.loadFile(path.join(__dirname,'../frontend/views/index.html'))
}

app.whenReady().then(()=>{
    createWindow()
})


// 🔌 IPC handlers para cada función del servicio

//Device
ipcMain.handle("list-devices", async () => {
  return await DeviceService.listDevices();
});

ipcMain.handle("get-device", async (event, id) => {
  return await DeviceService.getDevice(id);
});

ipcMain.handle("create-device", async (event, deviceData) => {
  return await DeviceService.createDevice(deviceData);
});

ipcMain.handle("update-device", async (event, id, deviceData) => {
  return await DeviceService.updateDevice(id, deviceData);
});

ipcMain.handle("delete-device", async (event, id) => {
  return await DeviceService.deleteDevice(id);
});