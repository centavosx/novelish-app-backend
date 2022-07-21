const express = require('express')
const {
  addAuthor,
  getAuthorInformation,
  getBooks,
  follow,
} = require('../controllers/author')
const { getImage, uploadImg } = require('../controllers/authorImages')
const { authenticate } = require('../middlewares/authenticate')
const router = express.Router()

router.post('/:id', uploadImg, addAuthor)
router.get('/images/:id', getImage)
router.get('/', authenticate, getAuthorInformation)
router.post('/', authenticate, follow)
router.get('/books', getBooks)
module.exports = router
