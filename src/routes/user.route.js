//  require dependencies
const express = require("express");
const router = express.Router();
const { authorize } = require("../middleware/auth.middleware");
const {
  createUser,
  loginUser,
  retrieveUser,
} = require("../controllers/user.controller");
//  creating a route
router.post("/createUser", createUser);
router.post("/loginUser", loginUser);
router.get("/retrieveUser", authorize, retrieveUser);

//    exporting modules
module.exports = router;
