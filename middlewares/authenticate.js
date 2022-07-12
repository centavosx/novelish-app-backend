const jwt = require('jsonwebtoken')
const { decryptText, encryptText } = require('../encryption')
const Token = require('../models/token')
const Users = require('../models/users')
const sha256 = require('crypto-js/sha256')
const bcrypt = require('bcrypt')
const authenticate = async function (req, res, next) {
  try {
    console.log(req.query)
    const authHeader = req.headers['authorization']
    console.log(authHeader)
    const dataSplit = authHeader.split(' ')
    if (dataSplit.length < 2)
      return res.status(403).json({ message: 'Not authorize' })
    if (dataSplit[0] !== 'Bearer')
      return res.status(403).json({ message: 'Not authorize' })
    const token = decryptText(dataSplit[1])
    jwt.verify(token, process.env.ACCESS_SECRET, async (err, dataValues) => {
      if (err)
        return await validateRefreshToken(req.query.token, req, res, next)
      if (!('_id' in dataValues))
        return res.status(500).json({ message: 'Invalid Token' })
      await generateToken(
        dataValues,
        decryptText(req.query.token),
        req.query.id,
        req,
        res
      )
      return next()
    })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const generateNewToken = async function (dataValues, token, userid, req, res) {
  try {
    const user = await Users.findOne({ email: dataValues.email })
    const isPasswordValid = await bcrypt.compare(
      dataValues.password,
      user.password
    )

    if (!isPasswordValid)
      return res.status(500).json({ message: 'Invalid token' })
    const data = {
      _id: user._id.toString(),
      verified: user.verified,
      username: user.username,
      email: user.email,
      password: user.password,
    }
    const newRefreshToken = jwt.sign(
      { email: data.email, password: data.password },
      process.env.ACCESS_SECRET
    )
    const newAccessToken = jwt.sign(data, process.env.ACCESS_SECRET, {
      expiresIn: '60s',
    })
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)
    try {
      await Token.deleteOne({
        userId: userid.replaceAll(' ', '+'),
        tkn: sha256(token).toString(),
      })
    } catch (e) {
      console.log(e)
    }
    const newToken = new Token({
      userId: userid.replaceAll(' ', '+'),
      tkn: sha256(newRefreshToken).toString(),
      expirationDate: expiry,
    })
    await newToken.save()
    req.accessToken = encryptText(newAccessToken)
    req.refreshToken = encryptText(newRefreshToken)
    req.userId = data._id
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const validateRefreshToken = async (refreshToken, req, res, next) => {
  try {
    if (typeof refreshToken === 'undefined')
      return res.status(500).json({ message: 'Please add token' })
    const token = decryptText(refreshToken)
    const tokenExist = await Token.findOne({
      userId: req.query.id.replaceAll(' ', '+'),
      tkn: sha256(token).toString(),
    })
    if (!tokenExist) return res.status(500).json({ message: 'Wrong token' })
    jwt.verify(token, process.env.REFRESH_SECRET, async (err, dataValues) => {
      if (err) return res.status(403).json({ message: 'Not authorize' })
      await generateNewToken(dataValues, token, req.query.id, req, res)
      return next()
    })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

module.exports = {
  authenticate,
}
