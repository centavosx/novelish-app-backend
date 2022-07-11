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
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
})

const tagSchema = new mongoose.Schema({
  tagName: { type: String, required: true },
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
  bookCoverImg: {
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
  language: {
    type: String,
    required: true,
  },
  mainGenre: { type: String, required: true },
  secondaryGenre: { type: String, required: true },
  tags: {
    type: [tagSchema],
    required: true,
  },
  comments: { type: [commentSchema], required: false },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  viewedBy: { type: [userSchema], required: false },
  likedBy: { type: [userSchema], required: false },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
  },
})
module.exports = { commentSchema }
module.exports = mongoose.model('Books', booksSchema)
