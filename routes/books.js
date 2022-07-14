const express = require('express')
const router = express.Router()
const {
  getAllBooks,
  addBook,
  updateBook,
  addChapter,
  unlockChapter,
  readChapter,
} = require('../controllers/books')
const { uploadImg } = require('../controllers/bookImages')
const { authenticate } = require('../middlewares/authenticate')
router.get('/', getAllBooks)

// router.get('/getBook/:id', getBook, (req, res) => {
//   res.send(res.book)
// })

router.post('/', uploadImg, addBook)
router.get('/:bookId/:chapterId', authenticate, readChapter)
router.patch('/:bookId/:chapterId', authenticate, unlockChapter)
router.patch('/:id', updateBook)
router.post('/chapter/:id', addChapter)

// router.patch('/updateBook/:id', async (req, res) => {})

// router.delete('/removeBook/:id', async (req, res) => {})

// async function getBook(req, res, next) {
//   let book
//   try {
//     book = await Books.findById(req.params.id)
//     if (book === null)
//       return res.status(404).json({ message: 'Book not found' })
//   } catch (err) {
//     return res.status(500).json({ message: err.message })
//   }
//   res.book = book
//   next()
// }

module.exports = router
