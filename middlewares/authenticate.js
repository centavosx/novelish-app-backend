const jwt = require('jsonwebtoken')
const { decryptText, encryptText } = require('../encryption')
const Token = require('../models/token')
const authenticate = async function (req, res, next) {
  try {
    const authHeader = req.headers['authorization']
    const dataSplit = authHeader.split(' ')
    if (dataSplit.length < 2)
      return res.status(403).json({ message: 'Not authorize' })
    if (dataSplit[0] !== 'Bearer')
      return res.status(403).json({ message: 'Not authorize' })
    const token = dataSplit[1]
    jwt.verify(token, process.env.ACCESS_SECRET, (err, dataValues) => {
      if (err) return res.status(403).json({ message: 'Not authorize' })
      req.importantData = dataValues
      next()
    })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const validateToken = async (req, res, next) => {
  try {
    if (typeof req.query.token === 'undefined')
      return res.status(500).json({ message: 'Please add token' })
    const token = decryptText(req.query.token)
    const tokenExist = await Token.findOne({ tkn: token })
    if (!tokenExist) return res.status(500).json({ message: 'Wrong token' })
    jwt.verify(token, process.env.ACCESS_SECRET, async (err, dataValues) => {
      if (err) return res.status(403).json({ message: 'Not authorize' })
      const data = {
        _id: dataValues._id.toString(),
        verified: dataValues.verified,
        username: dataValues.username,
        email: dataValues.email,
        password: dataValues.password,
      }
      const newRefreshToken = jwt.sign(data, process.env.ACCESS_SECRET)
      const newAccessToken = jwt.sign(data, process.env.ACCESS_SECRET, {
        expiresIn: '15s',
      })
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 30)
      const newToken = new Token({
        tkn: refreshToken,
        expirationDate: expiry,
      })
      await newToken.save()
      req.accessToken = encryptText(newAccessToken)
      req.refreshToken = encryptText(newRefreshToken)
      next()
    })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

module.exports = {
  authenticate,
}
