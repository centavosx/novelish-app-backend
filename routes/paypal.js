const express = require('express')

const router = express.Router()
const {
  success,
  pay,
  getTransactions,
  getCoins,
} = require('../controllers/transactions')
const { authenticate } = require('../middlewares/authenticate')

router.get('/cancelled', (req, res) =>
  res.json({ message: 'Cancelled', success: false })
)
router.get('/success', success)
router.get('/:start/:end', authenticate, getTransactions)
router.post('/pay', authenticate, pay)
router.get('/coins', getCoins)
module.exports = router
