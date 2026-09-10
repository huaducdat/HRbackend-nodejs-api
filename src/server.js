require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
  });
}

startServer();