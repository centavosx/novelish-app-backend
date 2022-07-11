const express = require('express')
const router = express.Router()
const { addUser } = require('../controllers/users')
const {
  checkEmail,
  checkUser,
  userExist,
} = require('../middlewares/validateUsers')

router.get('/:email/:password')
router.post('/', [checkEmail, checkUser], addUser)

module.exports = router
