//  Require dependencies
const User = require("../models/user.model");
const { successResMsg, errorResMsg } = require("../utils/response");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");

//  creating  a user
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, email, password, accountNumber } =
      req.body;
    // validating phoneNumber
    const phoneNumberExist = await User.findOne({ phoneNumber });
    if (phoneNumberExist) {
      return res.status(401).json({
        message: "phoneNumber exists, please login",
      });
    }
    // validating email
    const emailExist = await User.findOne({ email });
    if (emailExist) {
      return res.status(401).json({
        message: "email exists, please login",
      });
    }
    // validating accountNumber
    const accountNumberExist = await User.findOne({
      accountNumber,
    });
    if (accountNumberExist) {
      return res.status(401).json({
        message: "accounNumber exists, please login",
      });
    }
    
    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !email ||
      !password ||
      !accountNumber
    ) {
      return next(new AppError("Please fill in the required field", 400));
    }
    //  hashing password
    const hashPassword = await bcrypt.hash(password, 10);
    // creating a new user
    const newUser = await User.create({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashPassword,
      accountNumber,
    });
    const payload = {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };
    const token = await jwt.sign(payload, process.env.SECRET_TOKEN, {
      expiresIn: "1h",
    });
    return successResMsg(res, 201, { message: "User created", newUser, token });
  } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};

// logging in a user
const loginUser = async (req, res, next) => {
  try {
    const { phoneNumber, password } = req.body;
    const phoneNumberExist = await User.findOne({ phoneNumber });
    if (!phoneNumberExist) {
      return res.status(401).json({
        message: "phoneNumber does not exist, please create an account",
      });
    }
    let isPasswordExist = await bcrypt.compare(
      password,
      phoneNumberExist.password
    );
    if (!isPasswordExist) {
      return res.status(401).json({
        message: "Password Not Correct",
      });
    }
    if (phoneNumberExist.blocked == true) {
      return res.status(403).json({
        message: "Account has been suspended, please pay up!",
      });
    }
    const data = {
      id: phoneNumberExist._id,
      phoneNumber: phoneNumberExist.phoneNumber,
      role: phoneNumberExist.role,
    };

    const token = await jwt.sign(data, process.env.SECRET_TOKEN, {
      expiresIn: "1h",
    });
    return res.status(200).json({
      success: true,
      message: "User login successfully",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
//   retrieving accountNumber
const retrieveUser = async (req, res, next) => {
  try {
    const { phoneNumber } = req.query;
    const getUser = await User.findOne(
      { phoneNumber },
      {
        firstName: 0,
        lastName: 0,
        phoneNumber: 0,
        email: 0,
        password: 0,
        blocked: 0,
        role: 0,
      }
    );
    return res.status(200).json({
      getUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
//   exporting modules
module.exports = { createUser, loginUser, retrieveUser };
