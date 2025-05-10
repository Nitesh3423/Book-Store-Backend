require('dotenv').config(); // ✅ Load .env variables

const mongoose = require("mongoose");

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/api';

const connectDb = async () => {
  try {
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDb;