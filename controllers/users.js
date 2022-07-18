const Users = require('../models/users')
const UserImages = require('../models/userImages')
const Books = require('../models/books')
const Token = require('../models/token')
const bcrypt = require('bcrypt')
const { addImage } = require('./userImages')
const { isRequired } = require('./comments')
const jwt = require('jsonwebtoken')
const { encryptText, decryptText } = require('../encryption')
const { sendEmail } = require('../mail')
const sha256 = require('crypto-js/sha256')
const generate = () => {
  const digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let otp = ''
  for (let i = 0; i < 10; i++) {
    otp += digits[Math.round(Math.random() * 10)]
  }
  return otp
}
const newCode = async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.userId })
    const code = generate()
    if (
      await sendEmail(
        user.email,
        'New Verification Code',
        `<body>
        <h1>Good day ${user.name}</h1>
        <br/>
        <h4>Here is your verification code 
          <b><i>${code}</i></b>
        </h4>
        <br/>
        <h6>This code will expire in 5 minutes</h6>
      </body>`
      )
    ) {
      user.verification.otp = code
      user.verification.exp = new Date(
        new Date().setMinutes(new Date().getMinutes() + 5)
      )
      await user.save()
      return res.json({ sent: true })
    }
    return res.json({ sent: false })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}
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
    const code = generate()
    if (
      await sendEmail(
        req.body.email,
        'Verification Code',
        `<body>
        <h1>Good day ${req.body.name}</h1>
        <br/>
        <h4>Here is your verification code 
          <b><i>${code}</i></b>
        </h4>
        <br/>
        <h6>This code will expire in 5 minutes</h6>
      </body>`
      )
    ) {
      const user = new Users({
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        verification: { otp: code },
      })
      const newUser = await user.save()
      delete newUser['password']
      return res.json({ registered: true })
    }
    return res.json({ message: 'Failed' })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const insertProfilePicture = async (req, res) => {
  try {
    if (!isRequired([req.file]))
      return res
        .status(500)
        .json({ message: 'Please add a file', tkn: req.tkn, rtkn: req.rtkn })
    const userData = await Users.findById(req.userId)
    const newFileUrl = await addImage(req)
    if (typeof userData.img !== 'undefined') {
      let splitImg = userData.img.split('/')
      let id = splitImg[splitImg.length - 1]
      await UserImages.deleteOne({ _id: id })
    }
    const d = await Users.updateOne({ _id: req.userId }, { img: newFileUrl })
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
    const accessToken = jwt.sign(
      val.verified ? newData : { email: val.email, password: val.password },
      process.env.ACCESS_SECRET,
      {
        expiresIn: val.verified ? '30s' : '20m',
      }
    )
    if (val.verified) {
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
      newData['rtkn'] = encryptText(refreshToken)
    }
    newData['tkn'] = encryptText(accessToken)
    newData['loggedin'] = val.verified
    delete newData['verified']
    delete newData['password']
    return res.json(newData)
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const addBookToLibrary = (req, res) => {
  try {
    Users.findOne({ _id: req.userId }, async (err, val) => {
      if (err)
        return res
          .status(500)
          .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
      let book = val.libraries.id(req.params.bookId)
      if (book !== null) await book.remove()
      else val.libraries.push({ _id: req.params.bookId })
      await val.save()

      return res.json({ updated: true, tkn: req.tkn, rtkn: req.rtkn })
    })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const getUserLibraries = async (req, res) => {
  try {
    const val = await Users.findOne({ _id: req.userId }, { 'libraries._id': 1 })
    const book = await Books.find(
      { $or: val.libraries },
      {
        _id: 1,
        bookName: 1,
        bookCoverImg: 1,
        mainGenre: 1,
        secondaryGenre: 1,
        publishDate: 1,
      }
    )
    return res.json({ book, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const deleteUserLibraries = async (req, res) => {
  try {
    if (!isRequired([req.body.data]))
      return res.status(500).json({
        message: 'Fill up all the blanks',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    const val = await Users.findOne({ _id: req.userId })
    for (let x of req.body.data) {
      await val.libraries.id(x).remove()
    }
    val.save()
    return res.json({ removed: true, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const getUserProfile = async (req, res) => {
  try {
    const user = await Users.findOne(
      { _id: req.userId },
      { libraries: 0, verification: 0, password: 0 }
    )
    if (!user) return res.status(403).json({ message: "User doesn't exist" })
    if (!user.verified)
      return res.status(403).json({ message: 'User is not yet verified' })
    return res.json({ data: user, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

module.exports = {
  addUser,
  loggedIn,
  insertProfilePicture,
  addBookToLibrary,
  getUserLibraries,
  newCode,
  deleteUserLibraries,
  getUserProfile,
}
