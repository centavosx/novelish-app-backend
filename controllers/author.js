const Authors = require('../models/author')

const { addImage } = require('./authorImages')
const { isRequired } = require('./comments')
const Books = require('../models/books')
const { sendEmail } = require('../mail')

const addAuthor = async (req, res) => {
  try {
    if (
      !isRequired([
        req.files,
        req.params.id,
        req.body.name,
        req.body.penName,
        req.body.bio,
        req.body.email,
      ])
    )
      return res.status(500).json({ message: 'Please fill up all the blanks' })
    const img = await addImage(req, 0)
    const digital = await addImage(req, 1)
    const id = await addImage(req, 2)

    if (
      await sendEmail(
        req.body.email,
        'You have been approved to become an author',
        `<body>
        <h1>Good day ${req.body.name}!!!</h1>
        <br/>
        <h4>We have good news for you. You have been approved as an author in Novelish, you may login your account as a writer with a Pen Named: <b><i>${req.body.penName}</i></b>
        </h4>
        <h4>Thank you very much! Have fun writing your own book!</h4>
      </body>`
      )
    ) {
      const author = new Authors({
        _id: req.params.id,
        name: req.body.name,
        penName: req.body.penName,
        bio: req.body.bio,
        email: req.body.email,
        digitalSignatureUrl: digital,
        idPicUrl: id,
        img: img,
      })
      const newUser = await author.save()
      delete newUser['password']
      return res.json({ registered: true })
    }
    return res.json({ message: 'Failed' })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const getAuthorInformation = async (req, res) => {
  try {
    const authorData = await Authors.findOne(
      { penName: req.query.author },
      { name: 1, img: 1, bio: 1, followers: 1, penName: 1 }
    )
    if (!authorData)
      return res
        .status(403)
        .json({ message: 'Author not found', tkn: req.tkn, rtkn: req.rtkn })
    const books = await Books.aggregate([
      {
        $match: { bookAuthor: req.query.author },
      },
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
          chapterNumber: { $size: '$chapters' },
          views: { $size: '$viewedBy' },
          likes: { $size: '$likedBy' },
        },
      },
      { $sort: { lastUpdated: -1 } },
    ])

    return res.json({
      data: {
        name: authorData.name,
        img: authorData.img,
        bio: authorData.bio,
        followers: authorData.followers?.length ?? 0,
        penName: authorData.penName,
        books: books.length,
      },
      follow: authorData.followers.id(req.userId) ? true : false,
      updated: books.slice(0, 3),
    })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}
const getBooks = async (req, res) => {
  try {
    const books = await Books.aggregate([
      {
        $match: { bookAuthor: req.query.author },
      },
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
          chapterNumber: { $size: '$chapters' },
          views: { $size: '$viewedBy' },
          likes: { $size: '$likedBy' },
        },
      },
      { $sort: { likes: -1 } },
    ])

    return res.json({
      book: books.slice(req.query.start, req.query.end),
    })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const insertProfilePicture = async (req, res) => {
  try {
    if (!isRequired([req.file]))
      return res
        .status(500)
        .json({ message: 'Please add a file', tkn: req.tkn, rtkn: req.rtkn })
    const userData = await Users.findById(req.userId)
    const newFileUrl = await addImage(req)
    if (typeof userData.img !== 'undefined') {
      let splitImg = userData.img.split('/')
      let id = splitImg[splitImg.length - 1]
      await UserImages.deleteOne({ _id: id })
    }
    const d = await Users.updateOne({ _id: req.userId }, { img: newFileUrl })
    res.json({ ...d, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const follow = async (req, res) => {
  try {
    const author = await Authors.findOne(
      { penName: req.query.author },
      { name: 1, img: 1, bio: 1, followers: 1, penName: 1 }
    )
    if (!author)
      return res
        .status(403)
        .json({ message: 'Author not found', tkn: req.tkn, rtkn: req.rtkn })
    if (author.followers.id(req.userId)) {
      author.followers.id(req.userId).remove()
    } else {
      author.followers.push({ _id: req.userId })
    }
    await author.save()
    return res.json({
      author,
      follow: author.followers.id(req.userId) ? true : false,
      tkn: req.tkn,
      rtkn: req.rtkn,
    })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

module.exports = {
  addAuthor,
  getBooks,
  insertProfilePicture,
  getAuthorInformation,
  follow,
}
