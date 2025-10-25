import { User } from "../model/user.js";

export class UserService {

static async registerUser(userData){
    try {
        if(!userData?.username || !userData?.password){
            throw new Error("registerUser: username y password son requeridos");
        }

        const existingUser = await User.getByUsername(userData.username);
        if(existingUser){
            throw new Error("registerUser: el nombre de usuario ya existe")
        }
        return await User.create(userData);
    } catch (error) {
        console.error("UserService Error [registerUser]: ", error);
        throw error;
    }
}

static async login(username, password){
  try {
    if(!username || !password){
        throw new Error("login: username y password son requeridos");
    }
        const user = await User.getByUsername(username);
        if (!user) throw new Error('login: usuario no encontrado');
        const isValid = await User.validatePassword(username, password);
        if (!isValid) throw new Error('login: credenciales inválidas');
        // return safe info
        return {
                id: user.id,
                username: user.username
        };
  } catch (error) {
    console.error("UserService Error [login]: ", error);
    throw error;
  }
}

static async getByUserId(id){
    try {
        if(!id){
            throw new Error("getByUserId: id es requerido");
        }
        return await User.getById(id);
    } catch (error) {
        console.error("UserService Error [getByUserId]: ", error);
        throw error;
    }
}



}
