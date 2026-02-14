export default {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./backend/db/db.sqlite",
    },
    useNullAsDefault: true,
    migrations: {
      directory: "./backend/db/migrations",
    },
  },
  production: {
    client: "sqlite3",
    connection: {
      filename: "./backend/db/db.sqlite",
    },
    useNullAsDefault: true,
    migrations: {
      directory: "./backend/db/migrations",
    },
  },
};
