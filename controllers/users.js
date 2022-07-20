const Users = require('../models/users')
const UserImages = require('../models/userImages')
const Authors = require('../models/author')
const Books = require('../models/books')
const Token = require('../models/token')
const bcrypt = require('bcrypt')
const { addImage } = require('./userImages')
const { isRequired } = require('./comments')
const jwt = require('jsonwebtoken')
const { encryptText, decryptText } = require('../encryption')
const { sendEmail } = require('../mail')
const sha256 = require('crypto-js/sha256')
const { bulkSave } = require('../models/users')
const generate = () => {
  const digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let otp = ''
  for (let i = 0; i < 10; i++) {
    otp += digits[Math.round(Math.random() * 10)]
  }
  return otp
}
const newCode = async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.userId })
    const code = generate()
    if (
      await sendEmail(
        user.email,
        'New Verification Code',
        `<body>
        <h1>Good day ${user.name}</h1>
        <br/>
        <h4>Here is your new verification code 
          <b><i>${code}</i></b>
        </h4>
        <br/>
        <h6>This code will expire in 5 minutes</h6>
      </body>`
      )
    ) {
      user.verification.otp = code
      user.verification.exp = new Date(
        new Date().setMinutes(new Date().getMinutes() + 5)
      )
      await user.save()
      return res.json({ sent: true })
    }
    return res.json({ sent: false })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}
const addUser = async (req, res) => {
  try {
    if (
      !isRequired([
        req.body.name,
        req.body.username,
        req.body.email,
        req.body.password,
      ])
    )
      return res.status(500).json({ message: 'Please fill up all the blanks' })
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
    const code = generate()
    if (
      await sendEmail(
        req.body.email,
        'Verification Code (NOVELISH)',
        `<body>
        <h1>Good day ${req.body.name}</h1>
        <br/>
        <p>Thank you for signing up in novelish!</p>
        <p>First, you need to verify your account. Here is your verification code 
          <b><i>${code}</i></b>
          <br/>
          <br/>
          Regards,<br/>
          Novelish
        </p>
        <br/>
        <h5>This code will expire in 5 minutes</h5>
      </body>`
      )
    ) {
      const user = new Users({
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        verification: { otp: code },
      })
      const newUser = await user.save()
      delete newUser['password']
      return res.json({ registered: true })
    }
    return res.json({ message: 'Failed' })
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

const loggedIn = async (req, res) => {
  try {
    const val = await Users.findOne(
      { email: req.query.email },
      { _id: 1, verified: 1, username: 1, email: 1, password: 1 }
    )
    const newData = {
      _id: val._id.toString(),
      verified: val.verified,
      username: val.username,
      email: val.email,
      password: val.password,
    }
    const accessToken = jwt.sign(
      val.verified ? newData : { email: val.email, password: val.password },
      process.env.ACCESS_SECRET,
      {
        expiresIn: val.verified ? '30s' : '20m',
      }
    )
    if (val.verified) {
      const refreshToken = jwt.sign(
        { _id: newData._id, email: newData.email, password: newData.password },
        process.env.REFRESH_SECRET,
        {
          expiresIn: '30d',
        }
      )
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 30)
      const newToken = new Token({
        userId: newData._id,
        tkn: sha256(refreshToken).toString(),
        expirationDate: expiry,
      })
      await newToken.save()
      newData['rtkn'] = encryptText(refreshToken)
    }
    newData['tkn'] = encryptText(accessToken)
    newData['loggedin'] = val.verified
    delete newData['verified']
    delete newData['password']
    return res.json(newData)
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const addBookToLibrary = (req, res) => {
  try {
    Users.findOne({ _id: req.userId }, async (err, val) => {
      if (err)
        return res
          .status(500)
          .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
      let book = val.libraries.id(req.params.bookId)
      if (book !== null) await book.remove()
      else val.libraries.push({ _id: req.params.bookId })
      await val.save()

      return res.json({ updated: true, tkn: req.tkn, rtkn: req.rtkn })
    })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const getUserLibraries = async (req, res) => {
  try {
    const val = await Users.findOne({ _id: req.userId }, { 'libraries._id': 1 })
    const book = await Books.find(
      { $or: val.libraries },
      {
        _id: 1,
        bookName: 1,
        bookCoverImg: 1,
        mainGenre: 1,
        secondaryGenre: 1,
        publishDate: 1,
      }
    )
    return res.json({ book, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const deleteUserLibraries = async (req, res) => {
  try {
    if (!isRequired([req.body.data]))
      return res.status(500).json({
        message: 'Fill up all the blanks',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    const val = await Users.findOne({ _id: req.userId })
    for (let x of req.body.data) {
      await val.libraries.id(x).remove()
    }
    val.save()
    return res.json({ removed: true, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const getUserProfile = async (req, res) => {
  try {
    const user = await Users.findOne(
      { _id: req.userId },
      { libraries: 0, verification: 0, password: 0 }
    )
    if (!user) return res.status(403).json({ message: "User doesn't exist" })
    if (!user.verified)
      return res.status(403).json({ message: 'User is not yet verified' })
    return res.json({ data: user, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const getNotifications = async (req, res) => {
  try {
    const users = await Users.find({})
    const books = await Books.find({})
    const authors = await Authors.find({})
    const dataOfUser = users.find((d) => d._id.toString() === req.userId)
    const notif = []
    //  {
    //   key: '1',
    //   image: jenny,
    //   username: ['dahyun__'],
    //   book: 'baka sakaling',
    //   chapter: 'chapter 13',
    //   what: 'comment',
    //   bookImg: sample1,
    // },
    let userData = {}
    let followedAuthors = {}
    let authorData = {}
    for (let x of authors) {
      authorData[x.penName] = x
      if (x.followers.find((d) => d._id.toString() === req.userId))
        followedAuthors[x.penName] = true
    }
    for (let bk of books) {
      const comments = bk.comments
      const chapters = bk.chapters
      const isPublished = bk.isPublished
      if (
        isPublished &&
        new Date(dataOfUser.dateVerified) < new Date(bk.publishDate)
      ) {
        notif.push({
          image: authorData[bk.bookAuthor].img,
          bookImg: bk.bookCoverImg,
          what: 'publish',
          book: bk.bookName,
          bookId: bk._id,

          username: [bk.bookAuthor],
          date: bk.publishDate?.toString() ?? 0,
        })
      }
      for (let x of comments) {
        if (x._id.toString() === req.userId) {
          const usernames = []
          let firstImage = undefined
          let lastDate = undefined

          for (let replies of x.replies) {
            console.log(replies)
            if (replies._id.toString() !== req.userId) {
              if (!userData[replies._id.toString()]) {
                userData[replies._id.toString()] = users.find(
                  (fd) => fd._id.toString() === replies._id.toString()
                )
              }

              if (!firstImage) firstImage = userData[replies._id.toString()].img
              if (
                !usernames.includes(userData[replies._id.toString()].username)
              )
                usernames.push(userData[replies._id.toString()].username)
              lastDate = replies.dateCreated
            }
          }
          if (usernames.length > 0)
            notif.push({
              image: firstImage,
              bookImg: bk.bookCoverImg,
              what: 'comment',
              bookId: bk._id,

              book: bk.bookName,
              username: usernames,
              date: lastDate?.toString() ?? 0,
            })
          break
        }
      }
      for (let x of chapters) {
        for (let comms of x.comments) {
          if (comms._id.toString() === req.userId) {
            const usernames = []
            let firstImage = undefined
            let lastDate = undefined
            for (let replies of comms.replies) {
              if (replies._id.toString() !== req.userId) {
                if (!userData[replies._id.toString()]) {
                  userData[replies._id.toString()] = users.find(
                    (fd) => fd._id.toString() === replies._id.toString()
                  )
                }
                if (!firstImage)
                  firstImage = userData[replies._id.toString()].img

                if (
                  !usernames.includes(userData[replies._id.toString()].username)
                )
                  usernames.push(userData[replies._id.toString()].username)
                lastDate = replies.dateCreated
              }
            }
            if (usernames.length > 0)
              notif.push({
                image: firstImage,
                bookImg: bk.bookCoverImg,
                what: 'comment',
                book: bk.bookName,
                bookId: bk._id,
                chapterId: x._id,
                chapter: x.chapterNumber,
                username: usernames,
                date: lastDate?.toString() ?? 0,
              })
            break
          }
        }
        if (followedAuthors[bk.bookAuthor]) {
          for (let updates of x.updateHistory) {
            if (!authorData[bk.bookAuthor])
              authorData[bk.bookAuthor] = authors.find(
                (ad) => ad.penName === bk.bookAuthor
              )
            notif.push({
              username: [bk.bookAuthor],
              image: authorData[bk.bookAuthor].img,
              book: bk.bookName,
              bookId: bk._id,
              chapter: x.chapterNumber,
              what: 'update',
              date: updates.date?.toString() ?? 0,
            })
          }
        }
      }
    }

    const sortedData = notif.sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json(sortedData)
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const authenticated = async (req, res) => {
  try {
    if (
      !isRequired([
        req.body.dataAuth,
        req.body.dataUser2,
        req.body.dataUser3,
        req.body.dataUser,
      ])
    )
      return res
        .status(403)
        .json({ message: 'Fill up the blanks', tkn: req.tkn, rtkn: req.rtkn })
    const email = decryptText(req.body.dataUser2)
    const id = decryptText(req.body.dataAuth)
    const picture = decryptText(req.body.dataUser3)

    const name = decryptText(req.body.dataUser)

    let val = await Users.findOne(
      { email },
      { _id: 1, verified: 1, username: 1, email: 1, password: 1 }
    )
    let userId = val?._id ?? undefined
    if (!val || !userId) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(id, salt)

      if (
        await sendEmail(
          email,
          'Thank you for signing in! (NOVELISH)',
          `<body>
        <h1>Good day ${name}</h1>
        <br/>
        <p>Thank you for joining in novelish! Have fun reading!<br/><br/>
          Regards,<br/>
          Novelish</p>
      </body>`
        )
      ) {
        const user = new Users({
          name: name,
          img: picture,
          username: email,
          email: email,
          password: hashedPassword,
          verified: true,
        })
        val = await user.save()
        userId = val._id
      }
    }
    if (!val.verified)
      return res.status(403).json({
        message: 'This user is not yet verified!',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    const newData = {
      _id: userId.toString(),
      verified: val.verified,
      username: val.username,
      email: val.email,
      password: val.password,
    }
    const accessToken = jwt.sign(
      val.verified ? newData : { email: val.email, password: val.password },
      process.env.ACCESS_SECRET,
      {
        expiresIn: val.verified ? '30s' : '20m',
      }
    )
    if (val.verified) {
      const refreshToken = jwt.sign(
        { _id: newData._id, email: newData.email, password: newData.password },
        process.env.REFRESH_SECRET,
        {
          expiresIn: '30d',
        }
      )
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 30)
      const newToken = new Token({
        userId: newData._id,
        tkn: sha256(refreshToken).toString(),
        expirationDate: expiry,
      })
      await newToken.save()
      newData['rtkn'] = encryptText(refreshToken)
    }
    newData['tkn'] = encryptText(accessToken)
    newData['loggedin'] = val.verified
    delete newData['verified']
    delete newData['password']
    return res.json({ notifs: newData, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

module.exports = {
  addUser,
  loggedIn,
  insertProfilePicture,
  addBookToLibrary,
  getUserLibraries,
  newCode,
  deleteUserLibraries,
  getUserProfile,
  getNotifications,
  authenticated,
}
