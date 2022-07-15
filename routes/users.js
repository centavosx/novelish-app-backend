const express = require('express')
const router = express.Router()
const {
  addUser,
  loggedIn,
  insertProfilePicture,
  addBookToLibrary,
  getUserLibraries,
} = require('../controllers/users')
const { uploadImg } = require('../controllers/userImages')
const {
  checkEmail,
  checkUser,
  userExist,
} = require('../middlewares/validateUsers')
const { authenticate } = require('../middlewares/authenticate')
router.get('/login/:password', userExist, loggedIn)
router.post('/insertPic', [uploadImg, authenticate], insertProfilePicture)
router.patch('/library/:bookId', authenticate, addBookToLibrary)
router.get('/library', authenticate, getUserLibraries)
router.post('/', [checkEmail, checkUser], addUser)

module.exports = router
