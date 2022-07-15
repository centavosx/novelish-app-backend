const jwt = require('jsonwebtoken')
const { decryptText, encryptText } = require('../encryption')
const Token = require('../models/token')
const Users = require('../models/users')
const sha256 = require('crypto-js/sha256')
const bcrypt = require('bcrypt')
const authenticate = async function (req, res, next) {
  try {
    const authHeader = req.headers['authorization']
    const tknHeader = req.headers['tkn']
    const dataSplit = authHeader.split(' ')
    if (dataSplit.length < 2 || typeof tknHeader === 'undefined')
      return res.status(403).json({ message: 'Not authorize' })
    if (dataSplit[0] !== 'Bearer')
      return res.status(403).json({ message: 'Not authorize' })
    const token = decryptText(dataSplit[1])

    jwt.verify(token, process.env.ACCESS_SECRET, async (err, dataValues) => {
      if (err) {
        if (!err.name === 'TokenExpiredError') {
          return res.status(403).json({ message: 'error' })
        } else {
          const val = await jwt.verify(token, process.env.ACCESS_SECRET, {
            ignoreExpiration: true,
          })
          return await refresh(tknHeader, val, req, res, next)
        }
      }
      if (typeof dataValues._id !== 'undefined')
        return await newAccess(
          {
            _id: dataValues._id.toString(),
            verified: dataValues.verified,
            username: dataValues.username,
            email: dataValues.email,
            password: dataValues.password,
          },
          tknHeader,
          req,
          res,
          next
        )
    })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const newAccess = async function (data, rtoken, req, res, next) {
  const user = await Users.findOne({ email: data.email })
  const isPasswordValid = user.password === data.password
  if (!isPasswordValid)
    return res.status(403).json({ message: 'Invalid token' })
  const newData = {
    _id: user._id.toString(),
    verified: user.verified,
    username: user.username,
    email: user.email,
    password: user.password,
  }
  const newAccessToken = jwt.sign(newData, process.env.ACCESS_SECRET, {
    expiresIn: '30s',
  })
  req.tkn = encryptText(newAccessToken)
  req.rtkn = rtoken
  req.userId = newData._id
  req.userCoin = user.coin
  return next()
}

const generateNewToken = async function (
  dataValues,
  token,
  tokenData,
  userid,
  req,
  res,
  next
) {
  try {
    const user = await Users.findOne({ email: dataValues.email })
    const isPasswordValid = user.password === dataValues.password
    if (!isPasswordValid)
      return res.status(403).json({ message: 'Invalid token' })
    const data = {
      _id: user._id.toString(),
      verified: user.verified,
      username: user.username,
      email: user.email,
      password: user.password,
    }
    let today = new Date()
    today.setDate(today.getDate() + 12)
    let refreshToken = token
    if (today >= new Date(tokenData.expirationDate)) {
      const newRefreshToken = jwt.sign(
        { email: data.email, password: data.password },
        process.env.REFRESH_SECRET
      )
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 30)
      try {
        await Token.deleteOne({
          userId: userid,
          tkn: sha256(token).toString(),
        })
        const newToken = new Token({
          userId: userid,
          tkn: sha256(newRefreshToken).toString(),
          expirationDate: expiry,
        })
        await newToken.save()
        refreshToken = encryptText(newRefreshToken)
      } catch (e) {
        console.log(e)
      }
    }
    const newAccessToken = jwt.sign(data, process.env.ACCESS_SECRET, {
      expiresIn: '30s',
    })

    req.tkn = encryptText(newAccessToken)
    req.rtkn = refreshToken
    req.userId = data._id
    req.userCoin = user.coin
    return next()
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const refresh = async function (rtoken, data, req, res, next) {
  try {
    const token = decryptText(rtoken)
    jwt.verify(token, process.env.REFRESH_SECRET, async (err, dataValues) => {
      if (err) return res.status(403).json({ message: 'Invalid token' })
      if (data._id !== dataValues._id)
        return res.status(403).json({ message: 'Invalid token' })
      const tokenExist = await Token.findOne({
        userId: dataValues._id,
        tkn: sha256(token).toString(),
      })
      if (!tokenExist) return res.status(403).json({ message: 'Invalid token' })
      return await generateNewToken(
        dataValues,
        rtoken,
        tokenExist,
        req.params.id,
        req,
        res,
        next
      )
    })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

module.exports = {
  authenticate,
}
