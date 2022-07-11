const { Types } = require('mongoose')
const Books = require('../models/books')
const Chapters = require('../models/bookChapters')
const { addImage } = require('./bookImages')
const { isRequired } = require('./comments')
const getAllBooks = async (req, res) => {
  try {
    const books = await Books.find()
    res.json(books)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

const addBook = async (req, res) => {
  try {
    if (
      !isRequired([
        req.files ? (req.files.length === 2 ? true : undefined) : undefined,
        req.body.name,
        req.body.author,
        req.body.desc,
      ])
    )
      return res.status(500).json({ message: 'Please fill up everything' })
    const bookImg = await addImage(req, 0)
    const bookBgImg = await addImage(req, 1)
    const books = new Books({
      bookName: req.body.name,
      bookImg: bookImg,
      bookCoverImg: bookBgImg,
      bookAuthor: req.body.author,
      description: req.body.desc,
    })
    const newBook = await books.save()
    await new Chapters({ _id: Types.ObjectId(newBook['_id']) }).save()
    return res.status(201).json(newBook)
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }
}

const updateBook = async (req, res) => {
  try {
    const data = await Books.updateOne(
      { _id: req.params.id },
      {
        bookName: req.body.bookName,
        bookAuthor: req.body.bookAuthor,
        description: req.body.description,
      }
    )
    return res.json(data)
  } catch (e) {
    return res.status(400).json({ message: err.message })
  }
}

module.exports = {
  getAllBooks,
  updateBook,
  addBook,
}
