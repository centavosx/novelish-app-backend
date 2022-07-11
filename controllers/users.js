const Users = require('../models/users')
const Token = require('../models/token')
const bcrypt = require('bcrypt')
const { addImage } = require('./userImages')
const { isRequired } = require('./comments')
const jwt = require('jsonwebtoken')
const { encryptText, decryptText } = require('../encryption')
const addUser = async (req, res) => {
  try {
    if (
      !isRequired([
        req.body.name,
        req.body.username,
        req.body.email,
        req.body.password,
      ])
    )
      return res.status(500).json({ message: 'Please fill up all the blanks' })
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
    const user = new Users({
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    })
    const newUser = await user.save()
    delete newUser['password']
    return res.json(newUser)
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const insertProfilePicture = async (req, res) => {
  try {
    if (!isRequired([req.file]))
      return res.status(500).json({ message: 'Please add a file' })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const loggedIn = async (req, res) => {
  try {
    const val = await Users.findOne(
      { email: req.query.email },
      { _id: 1, verified: 1, username: 1, email: 1, password: 1 }
    )
    const newData = {
      _id: val._id.toString(),
      verified: val.verified,
      username: val.username,
      email: val.email,
      password: val.password,
    }
    const accessToken = jwt.sign(newData, process.env.ACCESS_SECRET, {
      expiresIn: '5s',
    })
    const refreshToken = jwt.sign(newData, process.env.REFRESH_SECRET)
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)
    const newToken = new Token({
      tkn: refreshToken,
      expirationDate: expiry,
    })
    await newToken.save()
    newData['tkn'] = encryptText(accessToken)
    newData['rtkn'] = encryptText(refreshToken)
    delete newData['password']
    return res.json(newData)
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

module.exports = { addUser, loggedIn }
