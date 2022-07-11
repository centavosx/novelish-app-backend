const validator = require('validator')
const Users = require('../models/users')
const bcrypt = require('bcrypt')
const checkEmail = async function (req, res, next) {
  try {
    if (typeof req.body.email === 'undefined')
      return res.status(500).json({ message: 'Please add email' })
    if (!validator.isEmail(req.body.email))
      return res.status(500).json({ message: 'Invalid email' })
    const val = await Users.findOne({ email: req.body.email })
    if (val)
      return res
        .status(409)
        .json({ message: req.body.email + ' already exist' })
    next()
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}
const checkUser = async function (req, res, next) {
  try {
    if (typeof req.body.username === 'undefined')
      return res.status(500).json({ message: 'Please add username' })
    const val = await Users.findOne({ username: req.body.username })
    if (val)
      return res
        .status(409)
        .json({ message: req.body.username + ' already exist' })
    next()
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const userExist = async function (req, res, next) {
  try {
    if (
      typeof req.query.email === 'undefined' &&
      typeof req.params.password === 'undefined'
    )
      return res.status(500).json({ message: 'Fill up all the fields' })
    const user = await Users.findOne({ email: req.query.email })
    if (!user) {
      return res.status(404).json({ message: "User doesn't exist" })
    }
    const isPasswordValid = await bcrypt.compare(
      req.params.password,
      user.password
    )
    if (!isPasswordValid)
      return res.status(500).json({ message: 'Invalid password' })
    next()
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}
module.exports = { checkEmail, checkUser, userExist }
