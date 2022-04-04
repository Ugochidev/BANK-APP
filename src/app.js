// require dependencies
const express = require("express");
const router = express.Router();
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const userRoute = require("./routes/user.route");
const adminRoute = require("./routes/admin.route");

//  middleware
app.use(express.json());

const { PORT } = process.env;

// connecting to DB
const connectDB = require("./DBconnect/database");
connectDB;
// Base route
app.get("/", function (req, res) {
  res.send("Hello World!");
});

// route
app.use("/api/v1", userRoute);
app.use("/api/v1", adminRoute);
// setting up a port
app.listen(PORT, async () => {
  console.log(`The app is listening on PORT ${PORT}`);
});
