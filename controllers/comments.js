const Books = require('../models/books')
const Chapters = require('../models/bookChapters')
const Users = require('../models/users')
const { Types } = require('mongoose')

const getCommentsWithUserData = async (userData, data, user) => {
  let newComment = []
  for (let x of data) {
    let idInString = x._id.toString()
    if (!userData[idInString]) {
      const user = await Users.findOne({ _id: x._id })
      userData[idInString] = user
    }
    newComment.push({
      _id: x._id,
      user: userData[idInString].username,
      img: userData[idInString].img,
      rating: x.rating,
      message: x.message,
      dateCreated: x.dateCreated,
      totalReplies: x.replies?.length,
      totalLikes: x.likedBy?.length ?? 0,
      liked: x.likeBy?.find((d) => d._id.toString() === user)
        ? true
        : false ?? false,
    })
  }
  return newComment
}

const getComments = async (req, res) => {
  try {
    let comments = await Books.findOne(
      { _id: req.params.id },
      {
        'comments._id': 1,
        'comments.rating': 1,
        'comments.message': 1,
        'comments.dateCreated': 1,
        'comments.replies': 1,
        'comments.likedBy': 1,
      }
    )
    let userData = {}
    let newComment = await getCommentsWithUserData(
      userData,
      comments.comments,
      req.userId
    )

    res.json({
      _id: comments._id,
      comments: newComment,
      tkn: req.tkn,
      rtkn: req.rtkn,
    })
  } catch (e) {
    res.status(400).json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}
const getReplies = async (req, res) => {
  try {
    Books.findById(req.params.bookId, async (err, value) => {
      if (err)
        return res
          .status(500)
          .json({ message: err.toString(), tkn: req.tkn, rtkn: req.rtkn })
      const val = value.comments.id(req.params.id)
      let userData = {}
      const user = await Users.findOne({ _id: req.params.id })
      userData[req.params.id] = user
      let newComment = await getCommentsWithUserData(
        userData,
        val.replies,
        req.userId
      )
      res.json({
        _id: val._id,
        user: userData[req.params.id].username,
        img: userData[req.params.id].img,
        rating: val.rating,
        message: val.message,
        totalLikes: val.likedBy?.length ?? 0,
        liked: val.likeBy?.find((d) => d._id.toString() === req.userId)
          ? true
          : false ?? false,
        replies: newComment,
        dateCreated: val.dateCreated,
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    })
  } catch (e) {
    res.status(400).json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const addComment = async (req, res) => {
  try {
    const data = req.body
    if (!isRequired([data.rating, data.message]))
      res.status(500).json({
        message: 'Please complete all the fields',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })
    Books.findOne(
      {
        _id: req.params.id,
      },
      async (err, val) => {
        if (err)
          return res
            .status(403)
            .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
        if (val === null)
          return res.status(403).json({
            message: 'Book or chapter not found',
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
        if (val.comments.id(req.userId) !== null)
          return res.status(403).json({
            message: 'You already commented in this story',
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
        val.comments.push({
          _id: Types.ObjectId(req.userId),
          rating: data.rating,
          message: data.message,
        })
        await val.save()
        res.json({ added: true, tkn: req.tkn, rtkn: req.rtkn })
      }
    )
  } catch (e) {
    res.status(500).json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}
const addReply = async (req, res) => {
  try {
    if (!isRequired([req.body.message]))
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
        _id: Types.ObjectId(req.userId),
        message: req.body.message,
      })
      value.save((err) => {
        if (err)
          return res
            .status(500)
            .json({ message: err.toString(), tkn: req.tkn, rtkn: req.rtkn })
        return res.json({
          added: true,
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
    if (!isRequired([req.params.bookId, req.params.chapterId]))
      return res.status(500).json({
        message: 'Fill up all the blanks',
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
        if (err)
          return res
            .status(403)
            .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
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

        let userData = {}
        let newComment = await getCommentsWithUserData(
          userData,
          val.chapters[0].comments,
          req.userId
        )

        return res.json({
          comments: newComment,
          tkn: req.tkn,
          rtkn: req.rtkn,
        })
      }
    )
  } catch (e) {
    return res
      .status(400)
      .json({ mesage: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}
const addChapterComments = async (req, res) => {
  try {
    if (
      !isRequired([
        req.params.bookId,
        req.params.chapterId,
        req.body.message,
        req.body.rating,
      ])
    )
      return res.status(500).json({
        message: 'Fill up all the blanks',
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
        if (err)
          return res
            .status(403)
            .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
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
        if (val.chapters[0].comments.id(req.userId) === null)
          return res.status(403).json({
            message: 'You already commented in this book',
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
        val.chapters[0].comments.push({
          _id: Types.ObjectId(req.userId),
          message: req.body.message,
          rating: req.body.rating,
        })
        await val.save()
        return res.json({
          added: true,
          tkn: req.tkn,
          rtkn: req.rtkn,
        })
      }
    )
  } catch (e) {
    return res
      .status(400)
      .json({ mesage: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const addChapterCommentReply = async (req, res) => {
  try {
    if (
      !isRequired([
        req.params.bookId,
        req.params.chapterId,
        req.params.commentId,
        req.body.message,
        req.body.rating,
      ])
    )
      return res.status(500).json({
        message: 'Fill up all the blanks',
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
        if (err)
          return res
            .status(403)
            .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
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
        let getComment = val.chapters[0].comments.id(req.params.commentId)
        if (getComment === null)
          return res.status(403).json({
            message: 'Comment not found',
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
        getComment.replies.push({
          _id: Types.ObjectId(req.userId),
          message: req.body.message,
          rating: req.body.rating,
        })
        await val.save()
        return res.json({
          tkn: req.tkn,
          rtkn: req.rtkn,
        })
      }
    )
  } catch (e) {
    return res
      .status(400)
      .json({ mesage: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const getChapterCommentReply = async (req, res) => {
  try {
    if (
      !isRequired([
        req.params.bookId,
        req.params.chapterId,
        req.params.commentId,
      ])
    )
      return res.status(500).json({
        message: 'Fill up all the blanks',
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
        if (err)
          return res
            .status(403)
            .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })
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
        let getComment = val.chapters[0].comments.id(req.params.commentId)
        if (getComment === null)
          return res.status(403).json({
            message: 'Comment not found',
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
        let userData = {}
        const user = await Users.findOne({ _id: req.params.commentId })
        userData[req.params.commentId] = user
        let newComment = await getCommentsWithUserData(
          userData,
          getComment.replies,
          false
        )

        return res.json({
          _id: getComment._id,
          user: userData[req.params.commentId].username,
          img: userData[req.params.commentId].img,
          rating: getComment.rating,
          message: getComment.message,
          totalLikes: getComment.likedBy?.length ?? 0,
          liked: getComment.likeBy?.find((d) => d._id.toString() === req.userId)
            ? true
            : false ?? false,
          replies: newComment,
          dateCreated: getComment.dateCreated,
          tkn: req.tkn,
          rtkn: req.rtkn,
        })
      }
    )
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
  getChapterComments,
  addChapterComments,
  addChapterCommentReply,
  getChapterCommentReply,
}
