//  Require dependencies
const User = require("../models/user.model");
const { successResMsg, errorResMsg } = require("../utils/response");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { sendMail } = require("../DBconnect/sendMail");
const {
  validiateUser,
  UserLogin,
  validPhoneNumber,
} = require("../middleware/validiate.middleware");

//  creating  a user
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, email, password, accountNumber } =
      req.body;
    const registerUser = await validiateUser.validateAsync(req.body);
    let accountNumberGenerator = [];
    for (i = 0; i < 10; i++) {
      num = Math.floor(Math.random() * 9);
      accountNumberGenerator.push(num);
      accountNumberGen = accountNumberGenerator.join("");
    }

    // validating phoneNumber
    const phoneNumberExist = await User.findOne({ phoneNumber });
    if (phoneNumberExist) {
      return next(new AppError("PhoneNumber already exist please login", 400));
    }
    // validating email
    const emailExist = await User.findOne({ email });
    if (emailExist) {
      return next(new AppError("email exists, please login", 400));
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
      accountNumber: accountNumberGen,
    });
    const data = {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };
    const url = "theolamideolanrewaju.com";
    const token = await jwt.sign(data, process.env.SECRET_TOKEN, {
      expiresIn: "2h",
    });
    let mailOptions = {
      to: newUser.email,
      subject: "Verify Email",
      text: `Hi ${firstName}, Pls verify your email. ${url}
       ${token}`,
    };
    await sendMail(mailOptions);
    return successResMsg(res, 201, { message: "User created", newUser, token });
  } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};

// verifying Email

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const decodedToken = await jwt.verify(token, process.env.SECRET_TOKEN);
    const user = await User.findOne({ email: decodedToken.email }).select(
      "isVerfied"
    );
    if (user.isVerified) {
      return successResMsg(res, 200, {
        message: "user verified already",
      });
    }
    user.isVerified = true;
    user.save();
    return successResMsg(res, 201, { message: "User verified successfully" });
  } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};
// logging in a user
const loginUser = async (req, res, next) => {
  try {
    const { phoneNumber, password } = req.body;
    const loginUser = await UserLogin.validateAsync(req.body);
    const phoneNumberExist = await User.findOne({ phoneNumber });
    if (!phoneNumberExist) {
      return next(
        new AppError("PhoneNumber does not exist please sign-up", 400)
      );
    }
    let isPasswordExist = await bcrypt.compare(
      password,
      phoneNumberExist.password
    );
    if (!isPasswordExist) {
      return next(new AppError("Invalid password", 400));
    }
    if (phoneNumberExist.blocked == true) {
      return next(
        new AppError(
          "Your account has been suspended, please contact customer care",
          403
        )
      );
    }
    if (!emailExist.isVerified) {
      return res.status(401).json({ message: "User not verified" });
    }
    const data = {
      id: phoneNumberExist._id,
      phoneNumber: phoneNumberExist.phoneNumber,
      role: phoneNumberExist.role,
    };

    const token = await jwt.sign(data, process.env.SECRET_TOKEN, {
      expiresIn: "1h",
    });
    return successResMsg(res, 200, {
      message: "User logged in sucessfully",
      token,
    });
  } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};
//   retrieving accountNumber
const retrieveUser = async (req, res, next) => {
  try {
    const { phoneNumber } = req.query;
    const result = await validPhoneNumber.validateAsync(req.query);
    const getUser = await User.findOne({ phoneNumber }).select("accountNumber");
    return successResMsg(res, 200, {
      message: "Get Users sucessfully",
      getUsers,
    });
  } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};
//   exporting modules
module.exports = { createUser, verifyEmail, loginUser, retrieveUser };
