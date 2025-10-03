const {app , BrowserWindow, ipcMain} = require ('electron')
const path = require('path')
const {DeviceService} = require('../backend/service/deviceService.js')

const createWindow = ()=>{
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile(path.join(__dirname,'../frontend/index.html'))
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