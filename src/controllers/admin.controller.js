//  Require dependencies

const Admin = require("../models/admin.model");
const User = require("../models/user.model");
const { successResMsg, errorResMsg } = require("../utils/response");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcrypt");
const { sendMail } = require("../DBconnect/sendMail");
const {
  validateRegister,
  validateLogin,
  isblocked,
} = require("../middleware/validiate.middleware");

//  creating  Admin
const createAdmin = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, email, password } = req.body;
    const result = await validateRegister.validateAsync(req.body);

    // validating phoneNumber
    const phoneNumberExist = await Admin.findOne({ phoneNumber });
    if (phoneNumberExist) {
      return next(new AppError("PhoneNumber already exist please login", 400));
    }
    // validating email
    const emailExist = await Admin.findOne({ email });
    if (emailExist) {
      return next(new AppError("email exists, please login", 400))
    }
    // hashing password
    const hashPassword = await bcrypt.hash(password, 10);

    // create  a new Admin
    const newAdmin = await Admin.create({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashPassword,
    });
     const data = {
       id: newAdmin_id,
       email: newAdmin.email,
       role: newAdmin.role,
     };
     const url = "theolamideolanrewaju.com";
     const token = await jwt.sign(data, process.env.SECRET_TOKEN, {
       expiresIn: "2h",
     });
     let mailOptions = {
       to: newAdmin.email,
       subject: "Verify Email",
       text: `Hi ${firstName}, Pls verify your email. ${url}
       ${token}`,
     };
     await sendMail(mailOptions);
    return successResMsg(res, 201, {
      message: "Admin  created",
      newAdmin,
    });
  } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};

// verifying Email

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const decodedToken = await jwt.verify(token, process.env.SECRET_TOKEN);
    const admin = await Admin.findOne({ email: decodedToken.email }).select(
      "isVerfied"
    );
    if (admin.isVerified) {
      return successResMsg(res, 200, {
        message: "admin verified already",
      });
    }
    admin.isVerified = true;
    admin.save();
    return successResMsg(res, 201, { message: "Admin verified successfully" });
  } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};
//  login for Admin
const loginAdmin = async (req, res, next) => {
  try {
    const { phoneNumber, password } = req.body;
    const login = await validateLogin.validateAsync(req.body);

    const phoneNumberExist = await Admin.findOne({ phoneNumber });
    if (!phoneNumberExist) {
       return next(new AppError("PhoneNumber does not exist please sign-up", 400))
    };
    let isPasswordExist = await bcrypt.compare(
      password,
      phoneNumberExist.password
    );
    if (!isPasswordExist) {
       return next(
         new AppError(" Invalid Password", 400)
       );
    }
    if (phoneNumberExist.role == "User") {
       return next(
         new AppError("Unauthorized", 401)
       );
    }
     if(!emailExist.isVerified){
      return res.status(401).json({message:"Admin not verified"})
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
      message: "Admin logged in sucessfully", token
    });
 } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};
//  getting all Users
const getAllUsers = async (req, res, next) => {
  try {
    const getUsers = await User.find();
    return successResMsg(res, 200, {
      message: "Get Users sucessfully", getUsers
    });
  } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};
//   blocking a user
const isBlocked = async (req, res, next) => {
  try {
    if (
      req.body.firstName ||
      req.body.lastName ||
      req.body.phoneNumber ||
      req.body.email ||
      req.body.password
    ) {
     return next(
         new AppError("Only blocked property can be modified", 401)
       );
    }
    const { email } = req.query;
    const result = await isblocked.validateAsync(req.query);
    const blockUser = await User.findOneAndUpdate({ email }, req.body, {
      new: true,
    });
    return successResMsg(res, 200, blockUser);
 } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};
//  counting all registered user
const countUsers = async (req, res, next) => {
  try {
    const usercount = await User.countDocuments();
   return successResMsg(res, 200, blockUser)
 } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};

//  exporting module
module.exports = {
  createAdmin,
  verifyEmail,
  loginAdmin,
  getAllUsers,
  isBlocked,
  countUsers,
};
