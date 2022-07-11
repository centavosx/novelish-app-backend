const express = require('express')
const router = express.Router()
const { addUser, loggedIn } = require('../controllers/users')
const {
  checkEmail,
  checkUser,
  userExist,
} = require('../middlewares/validateUsers')
const { authenticate } = require('../middlewares/authenticate')
router.get('/login/:password', userExist, loggedIn)
router.get('/check', authenticate, async (req, res) => {
  res.json({ message: 'Success', data: req.importantData })
})
router.post('/', [checkEmail, checkUser], addUser)

module.exports = router
