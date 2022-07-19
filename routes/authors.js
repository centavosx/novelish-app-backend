const express = require('express')
const { addAuthor } = require('../controllers/author')
const { getImage, uploadImg } = require('../controllers/authorImages')
const router = express.Router()

router.post('/:id', uploadImg, addAuthor)
router.get('/images/:id', getImage)
module.exports = router
