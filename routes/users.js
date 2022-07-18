const express = require('express')
const router = express.Router()
const {
  addUser,
  loggedIn,
  insertProfilePicture,
  addBookToLibrary,
  getUserLibraries,
  newCode,
  deleteUserLibraries,
  getUserProfile,
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
router.get('/profile', authenticate, getUserProfile)
router.get('/login', authenticate, (req, res) =>
  res.json({ tkn: req.tkn, rtkn: req.rtkn })
)
router.get('/library', authenticate, getUserLibraries)
router.patch('/library', authenticate, deleteUserLibraries)
router.post('/', [checkEmail, checkUser], addUser)

module.exports = router
