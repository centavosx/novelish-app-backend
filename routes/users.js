const express = require('express')
const router = express.Router()
const {
  addUser,
  loggedIn,
  insertProfilePicture,
  addBookToLibrary,
  getUserLibraries,
  newCode,
} = require('../controllers/users')
const { uploadImg } = require('../controllers/userImages')
const {
  checkEmail,
  checkUser,
  userExist,
} = require('../middlewares/validateUsers')
const {
  authenticate,
  verification,
  verifyToSend,
} = require('../middlewares/authenticate')
router.patch('/verify/:otp', verification, (req, res) => res.json(req.userData))
router.patch('/requestOtp', verifyToSend, newCode)
router.get('/login/:password', userExist, loggedIn)
router.post('/insertPic', [uploadImg, authenticate], insertProfilePicture)
router.patch('/library/:bookId', authenticate, addBookToLibrary)
router.get('/library', authenticate, getUserLibraries)
router.post('/', [checkEmail, checkUser], addUser)

module.exports = router
