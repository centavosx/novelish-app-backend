const Books = require('../models/books')
const Chapters = require('../models/bookChapters')
const getComments = async (req, res) => {
  try {
    let comments = await Books.find(
      { _id: req.params.id },
      {
        _id: 0,
        __v: 0,
        readBy: 0,
        dateCreated: 0,
        'comments.replies': 0,
      }
    )
    res.json(comments)
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
}
const getReplies = async (req, res) => {
  try {
    Books.findById(req.params.bookId, (err, value) => {
      if (err) return res.status(500).json({ message: err.toString() })
      const val = value.comments.id(req.params.id)
      res.json(val)
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
}

const addComment = async (req, res) => {
  try {
    const data = req.body
    if (!isRequired([data.name, data.rating, data.message]))
      res.status(500).json({
        message: 'Please complete all the fields',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    const comments = await Books.updateOne(
      { _id: req.params.id },
      {
        $push: { comments: { username: 'vince', rating: 5, message: 'hello' } },
      }
    )
    res.json({ ...comments, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    res.status(500).json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}
const addReply = async (req, res) => {
  try {
    if (!isRequired([req.body.username, req.body.message]))
      return res.status(500).json({
        message: 'Please complete all the fields',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    Books.findById(req.params.bookId, (err, value) => {
      if (err)
        return res
          .status(500)
          .json({ message: err.toString(), tkn: req.tkn, rtkn: req.rtkn })
      let comments = value.comments.id(req.params.id)
      comments.replies.push({
        username: req.body.username,
        message: req.body.message,
      })
      value.save((err) => {
        if (err) return res.status(500).json({ message: err.toString() })
        return res.json({
          replies: comments.replies,
          tkn: req.tkn,
          rtkn: req.rtkn,
        })
      })
    })
  } catch (e) {
    return res
      .status(400)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const getChapterComments = async (req, res) => {
  try {
    if (
      !isRequired([req.params.userId, req.params.bookId, req.params.chapterId])
    )
      return res.status(500).json({
        message: 'Fill up all the blanks',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
  } catch (e) {
    return res
      .status(400)
      .json({ mesage: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const isRequired = (arr = []) => {
  for (let x of arr) {
    if (typeof x === 'undefined') return false
  }
  return true
}

module.exports = {
  getComments,
  getReplies,
  addComment,
  addReply,
  isRequired,
}
