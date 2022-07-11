const express = require('express')
const router = express.Router()
const UserImages = require('../controllers/userImages')
const BookImages = require('../controllers/bookImages')

router.get('/users/:id', UserImages.getImage)

router.get('/books/:id', BookImages.getImage)

module.exports = router
