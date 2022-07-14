const Users = require('../models/users')
const UserImages = require('../models/userImages')
const Token = require('../models/token')
const bcrypt = require('bcrypt')
const { addImage } = require('./userImages')
const { isRequired } = require('./comments')
const jwt = require('jsonwebtoken')
const { encryptText, decryptText } = require('../encryption')
const sha256 = require('crypto-js/sha256')
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
    if (!isRequired([req.file, req.params.id]))
      return res
        .status(500)
        .json({ message: 'Please add a file', tkn: req.tkn, rtkn: req.rtkn })
    const userData = await Users.findById(req.params.id)
    const newFileUrl = await addImage(req)
    console.log(userData.img)
    if (typeof userData.img !== 'undefined') {
      let splitImg = userData.img.split('/')
      let id = splitImg[splitImg.length - 1]
      await UserImages.deleteOne({ _id: id })
    }
    const d = await Users.updateOne({ id: req.params.id }, { img: newFileUrl })
    res.json({ ...d, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
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
      expiresIn: '30s',
    })
    const refreshToken = jwt.sign(
      { _id: newData._id, email: newData.email, password: newData.password },
      process.env.REFRESH_SECRET,
      {
        expiresIn: '30d',
      }
    )
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)
    const newToken = new Token({
      userId: newData._id,
      tkn: sha256(refreshToken).toString(),
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

module.exports = { addUser, loggedIn, insertProfilePicture }
