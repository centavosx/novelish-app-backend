const express = require('express')
const router = express.Router()
const Books = require('../models/books')
const Chapters = require('../models/bookChapters')
router.get('/', async (req, res) => {
  try {
    const books = await Books.find()
    res.json(books)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', getBook, (req, res) => {
  res.send(res.book)
})

router.post('/', async (req, res) => {
  try {
    const books = new Books({
      bookName: 'True Love',
      bookImg:
        'https://tip.instructure.com/images/thumbnails/1328140/GtwICHOAVIdNleBolTednWLbU9CAoKM8rFBbhmSL',
      bookBgImg:
        'https://tip.instructure.com/users/30007/files/13752078/preview?verifier=kZa7ONQ5sBhHvxDuQbuZa3jgr8g3v7a3qTd5Cw17',
      bookAuthor: 'dahyun__',
      description: 'It is all about',
    })
    const newBook = await books.save()
    await new Chapters({ bookId: newBook['_id'] }).save()
    res.status(201).json(newBook)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.patch('/', async (req, res) => {})

router.delete('/', async (req, res) => {})

async function getBook(req, res, next) {
  let book
  try {
    book = await Books.findById(req.params.id)
    if (book === null)
      return res.status(404).json({ message: 'Book not found' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
  res.book = book
  next()
}
module.exports = router
