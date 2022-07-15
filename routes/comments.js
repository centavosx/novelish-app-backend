const express = require('express')
const router = express.Router()
const {
  getComments,
  getReplies,
  addComment,
  addReply,
  getChapterComments,
  addChapterComments,
  addChapterCommentReply,
  getChapterCommentReply,
} = require('../controllers/comments')

const { authenticate } = require('../middlewares/authenticate')

router.get('/:id', authenticate, getComments)
router.get('/:bookId/chapter/:chapterId', authenticate, getChapterComments)
router.post('/:bookId/chapter/:chapterId', authenticate, addChapterComments)
router.post(
  '/:bookId/chapter/:chapterId/:commentId',
  authenticate,
  addChapterCommentReply
)
router.get(
  '/:bookId/chapter/:chapterId/:commentId',
  authenticate,
  getChapterCommentReply
)
router.get('/replies/:bookId/:id', authenticate, getReplies)
router.post('/:id', authenticate, addComment)

router.post('/replies/:bookId/:id', authenticate, addReply)

module.exports = router
