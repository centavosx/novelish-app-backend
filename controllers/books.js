const { Types } = require('mongoose')
const Books = require('../models/books')
const Chapters = require('../models/bookChapters')
const Users = require('../models/users')
const Authors = require('../models/author')
const { addImage } = require('./bookImages')
const { isRequired } = require('./comments')

const isThisWeek = (date) => {
  const todayObj = new Date()
  const todayDate = todayObj.getDate()
  const todayDay = todayObj.getDay()
  const firstDayOfWeek = new Date(todayObj.setDate(todayDate - todayDay))
  const lastDayOfWeek = new Date(firstDayOfWeek)
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6)
  return date >= firstDayOfWeek && date <= lastDayOfWeek
}

const getRatingsAndComments = async (comments) => {
  let total = 0
  let totalCom = 0
  for (let x of comments) {
    if (isThisWeek(x.dateCreated)) {
      total += x.rating
      totalCom += x.replies.length + 1
    } else {
      for (let replies of x.replies) {
        if (isThisWeek(replies.dateCreated)) {
          console.log(replies)
          totalCom += 1
        }
      }
      totalCom += 1
    }
  }

  return { total, totalCom }
}
const getTotalReads = async (reads) => {
  let total = 0
  for (let x of reads) {
    if (isThisWeek(x.date)) {
      total += 1
    }
  }

  return total
}

const getAllBooks = async (req, res) => {
  try {
    const books = await Books.find(
      {},
      {
        _id: 1,
        comments: 1,
        bookName: 1,
        bookAuthor: 1,
        bookCoverImg: 1,
        status: 1,
        author: 1,
        language: 1,
        mainGenre: 1,
        secondaryGenre: 1,
        lastUpdated: 1,
      }
    )
    const book = []
    for (let bk of books) {
      let bookData = await Chapters.findOne({ _id: bk._id })
      let data = await getRatingsAndComments(bk.comments)
      let chapterRating = 0
      let totalComments = 0
      let totalReads = 0
      for (let x of bookData.chapters) {
        let data = await getRatingsAndComments(x.comments)
        totalReads += await getTotalReads(x.readBy)
        chapterRating += data.total
        totalComments += data.totalCom
      }

      featuredRating = Number(
        ((chapterRating + data.total) / 2 ?? 0).toFixed(1)
      )
      trendingRating = Number(
        (totalReads + (totalComments + data.totalCom) / 2 ?? 0) / 2 ?? 0
      )
      book.push({
        _id: bk._id,
        bookName: bk.bookName,
        bookCoverImg: bk.bookCoverImg,
        bookAuthor: bk.bookAuthor,
        status: bk.status,
        language: bk.language,
        mainGenre: bk.mainGenre,
        secondaryGenre: bk.secondaryGenre,
        featuredRating,
        trendingRating,
        lastUpdate: bk.lastUpdated,
      })
    }
    const authors = await Authors.find(
      {},
      {
        penName: 1,
        img: 1,
        followerNumber: { $size: '$followers' },
      }
    )
    let completed = book
      .filter((d) => d.status === 'complete')
      .sort(() => 0.5 - Math.random())
    let updated = book.sort(
      (a, b) => new Date(b.lastUpdated) > new Date(a.lastUpdated)
    )
    let topAuthors = authors.sort((a, b) => b.followerNumber - a.followerNumber)
    let trending = book.sort((a, b) => b.trendingRating - a.trendingRating)
    let featured = book.sort((a, b) => b.featuredRating - a.featuredRating)
    let newData = {
      trending: trending.slice(
        0,
        trending.length - 1 > 8 ? 8 : trending.length - 1
      ),
      featured: featured.slice(
        0,
        featured.length - 1 > 8 ? 8 : featured.length - 1
      ),
      updated: updated.slice(
        0,
        updated.length - 1 > 8 ? 8 : updated.length - 1
      ),
      completed: completed.slice(
        0,
        completed.length - 1 > 8 ? 8 : completed.length - 1
      ),
      topAuthors: topAuthors.slice(
        0,
        topAuthors.length - 1 > 8 ? 8 : topAuthors.length - 1
      ),
    }

    return res.json(newData)
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
      return res.status(500).json({
        message: 'Please fill up everything',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
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
          return res.status(403).json({
            message: 'Book or chapter not found',
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
        const userCoins = req.userCoin
        if (val.chapters[0].unlockedBy.id(req.userId) !== null)
          return res.status(200).json({
            message: 'User already bought this chapter',
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
        if (req.userCoins < val.chapters[0].coinPrice)
          return res.status(200).json({
            message: 'Not enough coins',
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
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
      return res.status(500).json({
        message: 'Please fill up everything',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
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
          return res.status(403).json({
            message: 'Book or chapter not found',
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
        if (val.chapters[0].unlockedBy.id(req.userId) === null)
          return res.status(403).json({
            message: 'Not owned by this user',
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
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
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
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

    res.json({ updated: chapter.acknowledge })
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
