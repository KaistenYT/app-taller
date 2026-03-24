import { io as Client } from "socket.io-client";
import { httpServer } from "../server.js";
import { emitToCompany, initSocket } from "../socket.js";
import { config } from "../config/env.js";

describe("WebSocket Integration", () => {
  let clientSocket;
  let port;

  beforeAll((done) => {
    // Escuchar en un puerto aleatorio para el test
    const server = httpServer.listen(() => {
      port = server.address().port;
      initSocket(httpServer, config.corsOrigin);
      clientSocket = new Client(`http://localhost:${port}`, {
        transports: ["websocket"],
      });
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    httpServer.close();
    clientSocket.disconnect();
  });

  test("Debe recibir un evento 'receptionCreated' cuando se emite a su empresa", (done) => {
    const companyId = 123;
    const testData = { id: 1, defect: "Pantalla rota" };

    // 1. El cliente se une a la sala de su empresa
    clientSocket.emit("joinCompany", companyId);

    // 2. Configuramos el escucha del evento esperado
    clientSocket.on("receptionCreated", (data) => {
      expect(data).toEqual(testData);
      done();
    });

    // 3. Simulamos la emisión desde el servicio (o directamente con la utilidad)
    // Usamos un pequeño delay para asegurar que el joinCompany se procesó
    setTimeout(() => {
      emitToCompany(companyId, "receptionCreated", testData);
    }, 50);
  });

  test("NO debe recibir eventos de otras empresas", (done) => {
    const myCompanyId = 1;
    const otherCompanyId = 2;
    let received = false;

    clientSocket.emit("joinCompany", myCompanyId);
    
    clientSocket.on("receptionCreated", () => {
      received = true;
    });

    // Emitimos a la empresa equivocada
    emitToCompany(otherCompanyId, "receptionCreated", { id: 99 });

    // Esperamos un poco y verificamos que no llegó nada
    setTimeout(() => {
      expect(received).toBe(false);
      done();
    }, 100);
  });
});
