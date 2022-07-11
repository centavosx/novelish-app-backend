const express = require('express')
const router = express.Router()
const {
  getComments,
  getReplies,
  addComment,
  addReply,
} = require('../controllers/comments')

router.get('/:id', getComments)
router.get('/replies/:bookId/:id', getReplies)
router.post('/:id', addComment)
router.post('/replies/:bookId/:id', addReply)

module.exports = router
