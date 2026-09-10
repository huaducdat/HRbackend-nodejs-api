const mongoose = require("mongoose");

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Kết nối MongoDB thành công");
  } catch (error) {
    console.error("Kết nối MongoDB thất bại:", error.message);
    process.exit(1);
  }
}

module.exports = connectDatabase;