const mongoose = require('mongoose')

const repliesSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
})

const commentSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  replies: {
    type: [repliesSchema],
    required: false,
  },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
})

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  startReadDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
})

const booksSchema = new mongoose.Schema({
  bookName: {
    type: String,
    required: true,
  },
  bookImg: {
    type: String,
    required: true,
  },
  bookBgImg: {
    type: String,
    required: true,
  },
  bookAuthor: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  comments: { type: [commentSchema], required: false },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  readBy: { type: [userSchema], required: false },
})
module.exports = { commentSchema }
module.exports = mongoose.model('Books', booksSchema)
