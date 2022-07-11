const Books = require('../models/books')
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
      res.status(500).json({ message: 'Please complete all the fields' })
    const comments = await Books.updateOne(
      { _id: req.params.id },
      {
        $push: { comments: { username: 'vince', rating: 5, message: 'hello' } },
      }
    )
    res.json(comments)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}
const addReply = async (req, res) => {
  try {
    if (!isRequired([req.body.username, req.body.message]))
      res.status(500).json({ message: 'Please complete all the fields' })
    Books.findById(req.params.bookId, (err, value) => {
      if (err) return res.status(500).json({ message: err.toString() })
      let comments = value.comments.id(req.params.id)
      comments.replies.push({
        username: req.body.username,
        message: req.body.message,
      })
      value.save((err) => {
        if (err) return res.status(500).json({ message: err.toString() })
        res.json(comments.replies)
      })
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
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
