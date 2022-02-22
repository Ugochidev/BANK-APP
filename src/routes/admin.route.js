//  require dependencies
const express = require("express");
const router = express.Router();
const { authorize, isAdmin } = require("../middleware/auth.middleware");
const {
  createAdmin,
  loginAdmin,
  getAllUsers,
  isBlocked,
  countUsers,
} = require("../controllers/admin.controller");
//  creating a route
router.post("/createAdmin", createAdmin);
router.post("/loginAdmin", loginAdmin);
router.get("/getAllUsers", authorize, isAdmin, getAllUsers);
router.patch("/block", authorize, isAdmin, isBlocked);
router.get("/countUsers", authorize, isAdmin, countUsers);

//    exporting modules
module.exports = router;
