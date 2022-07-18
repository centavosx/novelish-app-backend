const express = require('express')

const router = express.Router()
const { success, pay, addCoin } = require('../controllers/transactions')
const { authenticate } = require('../middlewares/authenticate')

router.get('/success', success)
router.post('/pay', authenticate, pay)
module.exports = router
