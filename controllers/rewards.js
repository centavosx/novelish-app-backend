const Users = require('../models/users')
const daysBetween = (first, second) => {
  return Math.round((second - first) / (1000 * 60 * 60 * 24))
}
const dailyLogin = async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.userId })
    if (!user) return res.status(403).json({ message: 'User not found' })
    let dateNow = new Date()
    if ((user.dailyLogin?.length ?? 0) < 7) {
      user.dailyLogin = []
      for (let i = 0; i < 7; i++) {
        user.dailyLogin.push({
          loggedIn: false,
          date: new Date(dateNow),
        })
        dateNow.setDate(dateNow.getDate() + 1)
        dateNow.setHours(23)
        dateNow.setMinutes(59)
        dateNow.setSeconds(59)
      }
    }
    if (
      new Date(user.dailyLogin[user.dailyLogin.length - 1].date) < new Date()
    ) {
      dateNow = new Date()
      user.dailyLogin = []
      for (let i = 0; i < 7; i++) {
        user.dailyLogin.push({
          loggedIn: false,
          date: new Date(dateNow),
        })
        dateNow.setDate(dateNow.getDate() + 1)
        dateNow.setHours(23)
        dateNow.setMinutes(59)
        dateNow.setSeconds(59)
      }
    }
    let loggedIn = false
    dateNow = new Date()
    const reward =
      req.userExp < 100 * 25
        ? 5
        : req.userExp < 100 * 50
        ? 6
        : req.userExp < 100 * 100
        ? 7
        : req.userExp < 100 * 150
        ? 8
        : 10
    for (let x in user.dailyLogin) {
      const d = new Date(user.dailyLogin[x].date)
      if (
        dateNow.getDate() === d.getDate() &&
        dateNow.getMonth() === d.getMonth() &&
        dateNow.getFullYear() === d.getFullYear()
      ) {
        if (!user.dailyLogin[x].loggedIn) user.coin += reward
        user.dailyLogin[x].loggedIn = true
        loggedIn = user.dailyLogin[x].loggedIn
      }
    }
    await user.save()
    return res.status(200).json({
      coin: user.coin,
      loggedIn,
      datesAttended: user.dailyLogin,
      reward,
      tkn: req.tkn,
      rtkn: req.rtkn,
    })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const getDailyLogin = async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.userId })
    if (!user) return res.status(403).json({ message: 'User not found' })
    let dateNow = new Date()

    if ((user.dailyLogin?.length ?? 0) < 7) {
      user.dailyLogin = []
      for (let i = 0; i < 7; i++) {
        user.dailyLogin.push({
          loggedIn: false,
          date: new Date(dateNow),
        })
        dateNow.setDate(dateNow.getDate() + 1)
        dateNow.setHours(23)
        dateNow.setMinutes(59)
        dateNow.setSeconds(59)
      }
    }

    if (
      new Date(user.dailyLogin[user.dailyLogin.length - 1].date) < new Date()
    ) {
      dateNow = new Date()
      user.dailyLogin = []
      for (let i = 0; i < 7; i++) {
        user.dailyLogin.push({
          loggedIn: false,
          date: new Date(dateNow),
        })
        dateNow.setDate(dateNow.getDate() + 1)
        dateNow.setHours(23)
        dateNow.setMinutes(59)
        dateNow.setSeconds(59)
      }
    }

    if (typeof user.attempt === 'number') user.attempt = []

    if (user.attempt?.length ?? 0 > 0) {
      const d = new Date(user.attempt[0].date)
      d.setDate(d.getDate() + 1)
      if (
        dateNow.getDate() === d.getDate() &&
        dateNow.getMonth() === d.getMonth() &&
        dateNow.getFullYear() === d.getFullYear()
      ) {
        user.attempt = []
      }
    }
    await user.save()
    let loggedIn = false
    dateNow = new Date()
    const reward =
      req.userExp < 100 * 25
        ? 5
        : req.userExp < 100 * 50
        ? 6
        : req.userExp < 100 * 100
        ? 7
        : req.userExp < 100 * 150
        ? 8
        : 10
    for (let x of user.dailyLogin) {
      const d = new Date(x.date)
      if (
        dateNow.getDate() === d.getDate() &&
        dateNow.getMonth() === d.getMonth() &&
        dateNow.getFullYear() === d.getFullYear()
      ) {
        loggedIn = x.loggedIn
      }
    }

    return res.status(200).json({
      coin: user.coin,
      attempt: user.attempt.length,
      loggedIn,
      reward,
      datesAttended: user.dailyLogin,
      tkn: req.tkn,
      rtkn: req.rtkn,
    })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const watchReward = async (req, res) => {
  try {
    const user = await Users.findOne(
      { _id: req.userId },
      { attempt: 1, coin: 1 }
    )
    if (!user)
      return res
        .status(403)
        .json({ message: 'User not found', tkn: req.tkn, rtkn: req.rtkn })
    if (user.attempt.length > 2)
      return res.status(403).json({
        message: 'No more attempts for today',
        coin: user.coin,
        attempt: user.attempt,
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    const userCoin = user.coin
    user.attempt.push({
      date: new Date(),
    })
    user.coin = userCoin + 20
    await user.save()
    return res.status(200).json({
      coin: user.coin,
      attempt: user.attempt.length,
      tkn: req.tkn,
      rtkn: req.rtkn,
    })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

module.exports = { dailyLogin, getDailyLogin, watchReward }
