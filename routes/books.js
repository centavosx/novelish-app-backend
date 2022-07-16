const express = require('express')
const router = express.Router()
const {
  getAllBooks,
  addBook,
  updateBook,
  addChapter,
  unlockChapter,
  readChapter,
  getAllPageBook,
  likeBook,
  getPopularityPageBook,
  getUpdatesPageBook,
  getCompletedBook,
  viewBook,
} = require('../controllers/books')
const { uploadImg } = require('../controllers/bookImages')
const { authenticate } = require('../middlewares/authenticate')
router.get('/', getAllBooks)
router.get('/all/:start/:end', getAllPageBook)
router.get('/popular/:start/:end', getPopularityPageBook)
router.get('/updates/:start/:end', getUpdatesPageBook)
router.get('/completed/:start/:end', getCompletedBook)
// router.get('/getBook/:id', getBook, (req, res) => {
//   res.send(res.book)
// })

router.post('/', uploadImg, addBook)
router.get('/:bookId/:chapterId', authenticate, readChapter)
router.get('/:bookId', authenticate, viewBook)
router.patch('/:bookId', authenticate, likeBook)
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
