require("dotenv").config();
const mongoose = require("mongoose");

const dbkey = process.env.dbKey;

const connectDB = async () => {
  try {
    await mongoose.connect(dbkey, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
module.exports = connectDB;
