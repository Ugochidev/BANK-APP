// require dependencies 
const jwt = require("jsonwebtoken");
require("dotenv").config();

//  authorizing admin
const authorize = async (req, res, next) => {
  try {
    let authorizationArr = req.headers.authorization.split(" ");
    if (!authorizationArr.includes("Bearer")) {
      return res.status(401).json({
        message: "Token required to start with Bearer...",
      });
    }
    let token = authorizationArr[1];
    if (!token) {
      return res.status(401).json({
        message: "Token is required...",
      });
    }
    const decryptToken = await jwt.verify(token, process.env.SECRET_TOKEN, {
      expiresIn: "1h",
    });
    req.user = decryptToken;
     next();
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
//  authenticating admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role == "Admin") {
      next();
    } else {
      return res.status(401).json({
        message: "User does not have access to this resource",
      });
    }
  } catch (error) {
      return res.status(500).json({
        message: error.message,
      });
  }
};

//    exporting modules
module.exports = { authorize, isAdmin };
