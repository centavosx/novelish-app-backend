const { Types } = require('mongoose')
const Books = require('../models/books')
const Chapters = require('../models/bookChapters')
const Users = require('../models/users')
const { addImage } = require('./bookImages')
const { isRequired } = require('./comments')

const getAllBooks = async (req, res) => {
  try {
    const books = await Books.find({}, { _id: 1 })

    res.json(books)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// const getTrendingBooks = async (books, date = new Date()) => {
//   let x = []
//   for (let bk of books) {
//     const books = await Chapters.findOne({ _id: bk._id }, { chapters: 1 })
//     const data = books.chapters
//     const date = 0
//     for (let i = data.length - 1; i >= 0; i--) {
//       if(data[i].)
//     }
//   }
// }
const unlockChapter = async (req, res) => {
  try {
    if (!isRequired([req.params.bookId, req.params.chapterId]))
      return res.status(500).json({ message: 'Please fill up everything' })
    Chapters.findOne(
      {
        _id: req.params.bookId,
      },
      {
        chapters: {
          $elemMatch: {
            _id: req.params.chapterId,
          },
        },
      },
      (err, val) => {
        if (err) return res.status(403).json({ message: err.message })
        if (val.chapters.length < 1)
          return res.status(403).json({ message: 'Book or chapter not found' })
        const userCoins = req.userCoin
        if (val.chapters[0].unlockedBy.id(req.userId) !== null)
          return res
            .status(200)
            .json({ message: 'User already bought this chapter' })
        val.chapters[0].unlockedBy.push({
          _id: Types.ObjectId(req.userId),
        })
        val.save(async (err) => {
          if (err) return res.status(500).json({ message: err.toString() })
          const updated = await Users.updateOne(
            { _id: req.userId },
            { coin: userCoins - val.chapters[0].coinPrice }
          )
          return res.json({ ...updated, tkn: req.tkn, rtkn: req.rtkn })
        })
      }
    )
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
const readChapter = async (req, res) => {
  try {
    if (!isRequired([req.params.bookId, req.params.chapterId]))
      return res.status(500).json({ message: 'Please fill up everything' })
    Chapters.findOne(
      {
        _id: req.params.bookId,
      },
      {
        chapters: {
          $elemMatch: {
            _id: req.params.chapterId,
          },
        },
      },
      async (err, val) => {
        if (err) return res.status(403).json({ message: err.message })
        if (val.chapters.length < 1)
          return res.status(403).json({ message: 'Book or chapter not found' })
        if (val.chapters[0].readBy.id(req.userId) === null) {
          val.chapters[0].readBy.push({
            _id: Types.ObjectId(req.userId),
          })
          await val.save()
        }
        return res.json({
          chapterData: {
            chapterName: val.chapters[0].chapterName,
            chapterNumber: val.chapters[0].chapterNumber,
            chapterStory: val.chapters[0].chapterStory,
            coinPrice: val.chapters[0].coinPrice,
            latestUpdate:
              val.chapters[0].updateHistory.length > 0
                ? val.chapters[0].updateHistory[
                    val.chapters[0].updateHistory.length - 1
                  ].date
                : null,
            numberOfReaders: val.chapters[0].readBy.length,
            numberOfUnlocks: val.chapters[0].unlockedBy.length,
          },
          tkn: req.tkn,
          rtkn: req.rtkn,
        })
      }
    )
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}
const addBook = async (req, res) => {
  try {
    if (
      !isRequired([
        req.body.name,
        req.body.author,
        req.body.desc,
        req.body.genre1,
        req.body.genre2,
        req.body.tags,
        req.body.language,
        req.body.publishDate,
      ])
    )
      return res.status(500).json({ message: 'Please fill up everything' })
    const bookBgImg = await addImage(req)
    const books = new Books({
      bookName: req.body.name,
      bookCoverImg: bookBgImg,
      bookAuthor: req.body.author,
      description: req.body.desc,
      mainGenre: req.body.genre1,
      secondaryGenre: req.body.genre2,
      tags: req.body.tags.map((d) => {
        return { tagName: d }
      }),
      language: req.body.language,
      publishDate: req.body.publishDate,
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
const addChapter = async (req, res) => {
  try {
    const chapter = await Chapters.updateOne(
      { _id: req.params.id },
      {
        $push: {
          chapters: {
            chapterNumber: req.body.number,
            chapterName: req.body.name,
            chapterStory: req.body.story,
            coinPrice: req.body.price,
            publishDate: new Date(req.body.date),
            isPublished: req.body.isPublish,
          },
        },
      }
    )
    res.json(chapter)
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

module.exports = {
  getAllBooks,
  updateBook,
  addBook,
  addChapter,
  unlockChapter,
  readChapter,
}
