import { Device } from "../model/device.js"

export class DeviceService {

static async listDevices(){
    return await Device.getAll()
    .then(devices => devices).catch(err => { throw err });
}

static async getDevice(id){
    return await Device.getById(id)
    .then(device => device).catch(err => { throw err });
}

static async createDevice(deviceData){
    return await Device.create(deviceData)
    .then(newDevice => newDevice).catch(err => { throw err });
}
static async updateDevice(id, deviceData){
    return await Device.update(id, deviceData)
    .then(() => true).catch(err => { throw err });
}
static async deleteDevice(id){
    return await Device.delete(id)
    .then(() => true).catch(err => { throw err });
}


}