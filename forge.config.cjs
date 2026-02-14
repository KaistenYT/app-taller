module.exports = {
  packagerConfig: {
    name: "NanoLogic",
    executableName: "NanoLogic",
    asar: {
      unpack: "**/backend/db/migrations/**",
    },
    // Incluir solo los archivos necesarios para producción
    ignore: [
      // Carpetas de desarrollo del frontend (el build ya está en dist/)
      /^\/frontend\/react\/app-taller\/src(\/|$)/,
      /^\/frontend\/react\/app-taller\/node_modules(\/|$)/,
      /^\/frontend\/react\/app-taller\/public(\/|$)/,
      /^\/frontend\/react\/app-taller\/vite\.config\.js$/,
      /^\/frontend\/react\/app-taller\/package-lock\.json$/,
      // Archivos de desarrollo raíz
      /^\/\.git(\/|$)/,
      /^\/\.gitignore$/,
      /^\/\.env$/,
      /^\/logs(\/|$)/,
      /^\/out(\/|$)/,
      /^\/tests?(\/|$)/,
      /^\/\.agent(\/|$)/,
      /^\/\.gemini(\/|$)/,
      // Documentos markdown
      /\.md$/,
      // Archivos de BD de desarrollo (se crea en userData en producción)
      /^\/backend\/db\/db\.sqlite$/,
      /^\/backend\/db\/db\.sqbpro$/,
    ],
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "NanoLogic",
        setupExe: "NanoLogic-Setup.exe",
        // setupIcon: "./assets/icon.ico", // Descomenta si tienes un ícono
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "linux", "win32"],
    },
  ],
};
