const express = require('express')
const router = express.Router()
const {
  addUser,
  loggedIn,
  insertProfilePicture,
} = require('../controllers/users')
const { uploadImg } = require('../controllers/userImages')
const {
  checkEmail,
  checkUser,
  userExist,
} = require('../middlewares/validateUsers')
const { authenticate } = require('../middlewares/authenticate')
router.get('/login/:password', userExist, loggedIn)
router.post('/insertPic/:id', [uploadImg, authenticate], insertProfilePicture)

router.post('/', [checkEmail, checkUser], addUser)

module.exports = router
