const express = require('express')

const router = express.Router()
const { authenticate } = require('../middlewares/authenticate')
const {
  dailyLogin,
  getDailyLogin,
  watchReward,
} = require('../controllers/rewards')

router.post('/user', authenticate, dailyLogin)
router.get('/user', authenticate, getDailyLogin)
router.post('/ad', authenticate, watchReward)
module.exports = router
