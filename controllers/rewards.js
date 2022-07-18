const Users = require('../models/users')
const daysBetween = (first, second) => {
  return Math.round((second - first) / (1000 * 60 * 60 * 24))
}
const dailyLogin = async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.userId })
    if (!user) return res.status(403).json({ message: 'User not found' })
    let checkDate = undefined
    if (user.dailyLogin?.length ?? 0 > 0)
      checkDate = new Date(user.dailyLogin[0].date)
    const first = new Date(user.verifiedDate ?? user.dateCreated)
    const last = new Date(first.toString())
    last.setDate(last.getDate() + 7)
    const today = new Date()
    const check = checkDate
      ? checkDate.getFullYear() === today.getFullYear() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getDate() === today.getDate()
      : false
    if (check && today.getDay() === first.getDay())
      return res.status(200).json({
        coin: user.coin,
        loggedIn: true,
        number: today.getDay() - first.getDay(),
        datesAttended: user.dailyLogin.map(
          (d, i) => new Date(d.date).getDay() - first.getDay()
        ),
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    if (!user.dailyLogin) user.dailyLogin = []
    for (let x of user.dailyLogin) {
      if (daysBetween(today, new Date(x.date)) === 0)
        return res.status(200).json({
          coin: user.coin,
          loggedIn: true,
          number: today.getDay() - first.getDay(),
          datesAttended: user.dailyLogin.map(
            (d, i) => new Date(d.date).getDay() - first.getDay()
          ),
          tkn: req.tkn,
          rtkn: req.rtkn,
        })
      if (daysBetween(today, new Date(x.date)) >= 7) {
        user.dailyLogin = []
        break
      }
    }

    if (today.getDay() === first.getDay()) user.dailyLogin = []
    user.dailyLogin.push({
      loggedIn: true,
    })
    await user.save()
    return res.status(200).json({
      coin: user.coin,
      loggedIn: true,
      number: today.getDay() - first.getDay(),
      datesAttended: user.dailyLogin.map(
        (d, i) => new Date(d.date).getDay() - first.getDay()
      ),
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
    let checkDate = undefined
    if (user.dailyLogin?.length ?? 0 > 0)
      checkDate = new Date(user.dailyLogin[0].date)
    const first = new Date(user.verifiedDate ?? user.dateCreated)
    const last = new Date(first.toString())
    last.setDate(last.getDate() + 7)
    const today = new Date()
    if (!user.lastLogin || !user.attempt) {
      user.lastLogin = new Date()
      user.attempt = 0
      await user.save()
    }
    const userLastLogin = new Date(user.lastLogin)
    if (daysBetween(today, userLastLogin) > 0) {
      user.attempt = 0
      await user.save()
    }
    const check = checkDate
      ? checkDate.getFullYear() === today.getFullYear() &&
        checkDate.getMonth() === today.getMonth() &&
        checkDate.getDate() === today.getDate()
      : false
    if (check && today.getDay() === first.getDay())
      return res.status(200).json({
        coin: user.coin,
        attempt: user.attempt,
        loggedIn: true,
        number: today.getDay() - first.getDay(),
        datesAttended: user.dailyLogin.map(
          (d, i) => new Date(d.date).getDay() - first.getDay()
        ),
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    if (!user.dailyLogin) user.dailyLogin = []
    for (let x of user.dailyLogin) {
      if (daysBetween(today, new Date(x.date)) === 0)
        return res.status(200).json({
          coin: user.coin,
          attempt: user.attempt,
          loggedIn: true,
          number: today.getDay() - first.getDay(),
          datesAttended: user.dailyLogin.map(
            (d, i) => new Date(d.date).getDay() - first.getDay()
          ),
          tkn: req.tkn,
          rtkn: req.rtkn,
        })
      if (daysBetween(today, new Date(x.date)) >= 7) {
        user.dailyLogin = []
        break
      }
    }
    if (today.getDay() === first.getDay()) user.dailyLogin = []
    await user.save()
    return res.status(200).json({
      coin: user.coin,
      attempt: user.attempt,
      loggedIn: false,
      number: today.getDay() - first.getDay(),
      datesAttended: user.dailyLogin.map(
        (d, i) => new Date(d.date).getDay() - first.getDay()
      ),
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
    if (user.attempt > 2)
      return res.status(403).json({
        message: 'No more attempts for today',
        coin: user.coin,
        attempt: user.attempt,
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    const userCoin = user.coin
    user.attempt += 1
    user.coin = userCoin + 20
    await user.save()
    return res.status(200).json({
      coin: user.coin,
      attempt: user.attempt,
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
