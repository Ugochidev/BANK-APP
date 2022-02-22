//  require dependencies
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// creating a Scheme
const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 6,
      max: 255,
    },
    lastName: {
      type: String,
      required: true,
      min: 6,
      max: 255,
    },
    phoneNumber: {
      type: String,
      required: true,
      min: 6,
      max: 255,
    },
    email: {
      type: String,
      required: true,
      min: 6,
      max: 255,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 255,
    },
    role: {
      type: String,
      enum: ["User"],
      default: "User",
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    accountNumber: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
//    exporting modules
module.exports = mongoose.model("user", userSchema);
