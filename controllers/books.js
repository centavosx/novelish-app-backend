const { Types } = require('mongoose')
const Books = require('../models/books')

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

const getRatingsAndComments = async (comments, all) => {
  let total = 0
  let totalCom = 0
  let i = 0
  for (let x of comments) {
    if (isThisWeek(x.dateCreated) || all) {
      total += x.rating
      totalCom += x.replies.length + 1
      i++
    } else {
      for (let replies of x.replies) {
        if (isThisWeek(replies.dateCreated) || all) {
          totalCom += 1
        }
      }
      totalCom += 1
    }
  }
  return { total, totalCom, i }
}
const getTotalReads = async (reads, all) => {
  let total = 0
  for (let x of reads) {
    if (isThisWeek(x.date) || all) {
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
        chapters: 1,
        viewedBy: 1,
        likedBy: 1,
        description: 1,
        publishDate: 1,
      }
    )
    const book = []
    for (let bk of books) {
      let data = await getRatingsAndComments(bk.comments)
      let chapterRating = 0
      let totalComments = 0
      let totalReads = 0
      for (let x of bk.chapters) {
        let data = await getRatingsAndComments(x.comments)
        totalReads += await getTotalReads(x.readBy)
        chapterRating += data.total
        totalComments += data.totalCom
      }

      const featuredRating = Number(
        ((chapterRating + data.total) / 2 ?? 0).toFixed(1)
      )
      const trendingRating = Number(
        (totalReads + (totalComments + data.totalCom) / 2 ?? 0) / 2 ?? 0
      )
      const editorsRating = Number(
        (bk.chapters.length + bk.likedBy.length + bk.viewedBy.length) / 3 ?? 0
      )

      book.push({
        _id: bk._id,
        bookName: bk.bookName,
        bookCoverImg: bk.bookCoverImg,
        bookAuthor: bk.bookAuthor,
        description: bk.description,
        status: bk.status,
        language: bk.language,
        mainGenre: bk.mainGenre,
        secondaryGenre: bk.secondaryGenre,
        featuredRating,
        trendingRating,
        editorsRating,
        likes: bk.likedBy?.length ?? 0,
        lastUpdate: bk.lastUpdated,
        publishDate: bk.publishDate,
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
    const completed = book
      .filter((d) => d.status === 'complete')
      .sort(() => 0.5 - Math.random())
    const updated = [
      ...book.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)),
    ]
    const topAuthors = authors.sort(
      (a, b) => b.followerNumber - a.followerNumber
    )
    const trending = [
      ...book.sort((a, b) => b.trendingRating - a.trendingRating),
    ]

    const featured = [
      ...book.sort((a, b) => b.featuredRating - a.featuredRating),
    ]
    const editorsPick = book.sort((a, b) => b.editorsRating - a.editorsRating)

    let newData = {
      trending: trending.slice(0, 9),
      featured: featured.slice(0, 9),
      updated: updated.slice(0, 9),
      completed: completed.slice(0, 9),
      topAuthors: topAuthors.slice(0, 9),
      editorsPick: editorsPick.slice(0, 9),
    }

    return res.json(newData)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

const getAllPageBook = async (req, res) => {
  try {
    const books = await Books.aggregate([
      {
        $project: {
          _id: 1,
          bookName: 1,
          bookAuthor: 1,
          bookCoverImg: 1,
          status: 1,
          author: 1,
          language: 1,
          mainGenre: 1,
          secondaryGenre: 1,
          lastUpdated: 1,
          description: 1,
          publishDate: 1,
          chapterNumber: { $size: '$chapters' },
          views: { $size: '$viewedBy' },
          likes: { $size: '$likedBy' },
        },
      },
      { $sort: { likes: -1 } },
    ])

    return res.json(books.slice(req.params.start, req.params.end))
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

const getPopularityPageBook = async (req, res) => {
  try {
    const books = await Books.aggregate([
      {
        $project: {
          _id: 1,
          bookName: 1,
          bookAuthor: 1,
          bookCoverImg: 1,
          status: 1,
          author: 1,
          language: 1,
          mainGenre: 1,
          secondaryGenre: 1,
          description: 1,
          lastUpdated: 1,
          publishDate: 1,
          chapterNumber: { $size: '$chapters' },
          views: { $size: '$viewedBy' },
          likes: { $size: '$likedBy' },
        },
      },
      { $sort: { views: -1 } },
    ])

    return res.json(books.slice(req.params.start, req.params.end))
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

const getUpdatesPageBook = async (req, res) => {
  try {
    const books = await Books.aggregate([
      {
        $project: {
          _id: 1,
          bookName: 1,
          bookAuthor: 1,
          bookCoverImg: 1,
          status: 1,
          author: 1,
          language: 1,
          mainGenre: 1,
          secondaryGenre: 1,
          description: 1,
          lastUpdated: 1,
          publishDate: 1,
          chapterNumber: { $size: '$chapters' },
          views: { $size: '$viewedBy' },
          likes: { $size: '$likedBy' },
        },
      },
      { $sort: { lastUpdated: -1 } },
    ])

    return res.json(books.slice(req.params.start, req.params.end))
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
const getChapterBook = async (req, res) => {
  try {
    const books = await Books.aggregate([
      {
        $project: {
          _id: 1,
          bookName: 1,
          bookAuthor: 1,
          bookCoverImg: 1,
          status: 1,
          author: 1,
          language: 1,
          mainGenre: 1,
          description: 1,
          secondaryGenre: 1,
          lastUpdated: 1,
          publishDate: 1,
          chapterNumber: { $size: '$chapters' },
          views: { $size: '$viewedBy' },
          likes: { $size: '$likedBy' },
        },
      },
      { $sort: { chapterNumber: -1 } },
    ])

    return res.json(books.slice(req.params.start, req.params.end))
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

const viewBook = async (req, res) => {
  try {
    const val = await Books.findOne(
      { _id: req.params.bookId },
      {
        'tags._id': 0,
        approval: 0,

        'chapters.chapterStory': 0,
      }
    )
    if (val === null)
      return res
        .status(403)
        .json({ message: 'Book not found', tkn: req.tkn, rtkn: req.rtkn })
    if (val.viewedBy.id(req.userId) === null) {
      val.viewedBy.push({ _id: req.userId })
      await val.save()
    }
    let bookData = await getRatingsAndComments(val.comments, true)
    let chapterRating = 0
    let totalComments = 0
    let totalReads = 0
    let iterate = 0
    let chapters = []
    for (let x of val.chapters) {
      let data = await getRatingsAndComments(x.comments, true)
      totalReads += await getTotalReads(x.readBy, true)

      chapterRating += data.total
      totalComments += data.totalCom
      if (x.isPublished && new Date() >= new Date(x.publishDate))
        chapters.push({
          _id: x._id,
          chapterNumber: x.chapterNumber,
          chapterName: x.chapterName,
          coinPrice: x.coinPrice,
          approval: x.approval,
          unlockedByUser: x.unlockedBy.id(req.userId) ? true : false,
        })
      iterate += 1
    }
    const users = await Users.findOne({ _id: req.userId }, { libraries: 1 })
    let saved = true
    if (users.libraries.id(val._id) === null) saved = false
    const newData = {
      _id: val._id,
      rating:
        ((bookData.total / bookData.i ?? 0) + (chapterRating / iterate ?? 0)) /
        2,
      comments: val.comments.slice(0, 3),
      totalReads,
      totalComments,
      chapters,
      bookName: val.bookName,
      bookCoverImg: val.bookCoverImg,
      bookAuthor: val.bookAuthor,
      description: val.description,
      language: val.language,
      mainGenre: val.mainGenre,
      secondaryGenre: val.secondaryGenre,
      tags: val.tags,
      status: val.status,
      totalLikes: val.likedBy.length,
      likedByUser: val.likedBy.find((d) => d._id.toString() === req.userId)
        ? true
        : false,
      lastUpdated: val.lastUpdated,
      publishDate: val.publishDate,
      saved,
    }

    return res.json({ data: newData, tkn: req.tkn, rtkn: req.rtkn })
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const getBookChapters = async (req, res) => {
  try {
    const val = await Books.findOne(
      { _id: req.params.bookId },
      {
        'chapters.chapterNumber': 1,
        'chapters._id': 1,
        'chapters.chapterName': 1,
        'chapters.coinPrice': 1,
        'chapters.publishDate': 1,
        'chapters.isPublished': 1,
        'chapters.unlockedBy': 1,
      }
    )
    if (val === null)
      return res
        .status(403)
        .json({ message: 'Book not found', tkn: req.tkn, rtkn: req.rtkn })

    let chapters = []
    for (let x of val.chapters) {
      if (x.isPublished && new Date() >= new Date(x.publishDate))
        chapters.push({
          _id: x._id,
          chapterNumber: x.chapterNumber,
          chapterName: x.chapterName,
          coinPrice: x.coinPrice,
          approval: x.approval,
          unlockedByUser: x.unlockedBy.id(req.userId) ? true : false,
        })
    }
    return res.json({ data: chapters, tkn: req.tkn, rtkn: req.rtkn })
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
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
    const val = await Books.findOne(
      {
        _id: req.params.bookId,
      },
      {
        chapters: {
          $elemMatch: {
            _id: req.params.chapterId,
          },
        },
      }
    )
    if (val.chapters.length < 1)
      return res.status(403).json({
        message: 'Book or chapter not found',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    const userCoins = req.userCoin
    if (val.chapters[0].coinPrice === 0)
      return res.status(200).json({
        updated: true,
        message: 'This chapter is free',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    if (val.chapters[0].unlockedBy.id(req.userId) !== null)
      return res.status(200).json({
        updated: true,
        message: 'User already bought this chapter',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    if (userCoins < val.chapters[0].coinPrice)
      return res.status(200).json({
        updated: false,
        message: 'Not enough coins',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    val.chapters[0].unlockedBy.push({
      _id: Types.ObjectId(req.userId),
    })
    await Users.updateOne(
      { _id: req.userId },
      { experience: req.userExp + 100 }
    )
    await val.save()
    await Users.updateOne(
      { _id: req.userId },
      { coin: userCoins - val.chapters[0].coinPrice }
    )

    return res.json({ updated: true, tkn: req.tkn, rtkn: req.rtkn })
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}
const unlockAllChapter = async (req, res) => {
  try {
    if (!isRequired([req.params.bookId]))
      return res.status(500).json({
        message: 'Please fill up everything',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    const val = await Books.findOne({
      _id: req.params.bookId,
    })
    const user = await Users.findOne({ _id: req.userId })
    if (!val)
      return res.status(403).json({
        message: 'Book not found',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    const userCoins = req.userCoin
    const total = 0
    for (index in val.chapters) {
      if (val.chapters[index].unlockedBy.id(req.userId) === null) {
        total += val.chapters[index].coinPrice
        user.experience += 100

        val.chapters[index].unlockedBy.push({ _id: Types.ObjectId(req.userId) })
      }
    }

    if (total === 0)
      return res.status(403).push({
        message: 'You already bought this book',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    if (userCoins < total)
      return res
        .status(403)
        .push({ message: 'Not enough coins', tkn: req.tkn, rtkn: req.rtkn })
    user.coin -= total
    await user.save()
    await val.save()
    return res.json({ updated: true, tkn: req.tkn, rtkn: req.rtkn })
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
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
    const val = await Books.findOne(
      {
        _id: req.params.bookId,
      },
      {
        chapters: {
          $elemMatch: {
            _id: req.params.chapterId,
          },
        },
        bookName: 1,
        bookCoverImg: 1,
        bookAuthor: 1,
      }
    )
    if (val === null)
      return res
        .status(403)
        .json({ message: 'Not Found', tkn: req.tkn, rtkn: req.rtkn })
    if (val.chapters.length < 1)
      return res.status(403).json({
        message: 'Book or chapter not found',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    console.log(val)
    if (
      val.chapters[0].unlockedBy.id(req.userId) === null &&
      val.chapters[0].coinPrice > 0
    )
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
        bookName: val.bookName,
        bookAuthor: val.bookAuthor,
        bookCoverImg: val.bookCoverImg,
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
      return res.status(500).json({
        message: 'Please fill up everything',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
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

    return res.status(201).json(newBook)
  } catch (err) {
    return res
      .status(400)
      .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
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
    const chapter = await Books.updateOne(
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
        lastUpdated: new Date(),
      }
    )

    res.json({ updated: chapter.acknowledged })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}
const likeBook = async (req, res) => {
  try {
    const book = await Books.findOne({ _id: req.params.bookId })
    if (book.likedBy.id(req.userId)) {
      await book.likedBy.id(req.userId).remove()
    } else {
      book.likedBy.push({ _id: req.userId })
    }
    await book.save()
    return res.json({ updated: true, tkn: req.tkn, rktn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rktn: req.rtkn })
  }
}

module.exports = {
  getAllBooks,
  updateBook,
  addBook,
  addChapter,
  unlockChapter,
  readChapter,
  getAllPageBook,
  likeBook,
  getPopularityPageBook,
  getUpdatesPageBook,
  getChapterBook,
  viewBook,
  getBookChapters,
  unlockAllChapter,
}
