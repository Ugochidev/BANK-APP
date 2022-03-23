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
      "isVerified"
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
       return next(new AppError("User not Verified", 401));
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
const forgetPasswordLink = async (req, res, next) => {
  try {
    const { email } = req.body;
    const userEmail = await User.findOne({ email });
    if (!userEmail) {
     return next(new AppError("email not found", 404));
    }
    const data = {
      id: userEmail._id,
      email: userEmail.email,
      role: userEmail.role,
    };
    // getting a secret token
    const secret_key = process.env.SECRET_TOKEN;
    const token = await jwt.sign(data, secret_key, { expiresIn: "1hr" });
    let mailOptions = {
      to: userEmail.email,
      subject: "Reset Password",
      text: `Hi ${userEmail.firstName}, Reset your password with the link below.${token}`,
    };
    await sendMail(mailOptions);
     return successResMsg(res, 200, {
        message: `Hi ${userEmail.firstName},reset password.`,
    });
  } catch (error) {
    return errorResMsg(res, 500, { message: error.message });
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { email, token } = req.query;
    const secret_key = process.env.SECRET_TOKEN;
    const decoded_token = await jwt.verify(token, secret_key);
    if (decoded_token.email !== email) {
     return next(new AppError("Email do not match.", 404));
    }
    if (newPassword !== confirmPassword) {
      return next(new AppError("Password do not match.", 404));
    }
    const hashPassword = await bcrypt.hash(confirmPassword, 10);
    const updatedPassword = await User.updateOne(
      { email },
      { password: hashPassword },
      {
        new: true,
      }
    );
   return successResMsg(res, 200, {
        message:`Password has been updated successfully.`,
    });
  } catch (error) {
     return errorResMsg(res, 500, { message: error.message });
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const { email } = req.query;
    const loggedUser = await User.findOne({ email });
    const headerTokenEmail = await jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.SECRET_TOKEN
    ).email;
    if(headerTokenEmail !== loggedUser.email ){
     return next(new AppError("Forbidden", 404));
    }
    const passwordMatch = await bcrypt.compare(
      oldPassword,
      loggedUser.password
    );
    if (!passwordMatch) {
     return next(new AppError("old Password is not correct.", 404));
    }
    if (newPassword !== confirmPassword) {
      return next(new AppError("Password do not match.", 400));
    }
    const hashPassword = await bcrypt.hash(confirmPassword, 10);
    const resetPassword = await User.updateOne(
      { email },
      { password: hashPassword }
    );
    return successResMsg(res, 200, {
        message:`Password has been updated successfully.`,
    });
  } catch (error) {
   return errorResMsg(res, 500, { message: error.message });
  }
};

//   exporting modules
module.exports = {
  createUser,
  verifyEmail,
  loginUser,
  retrieveUser,
  forgetPasswordLink,
  changePassword,
  resetPassword,
};
