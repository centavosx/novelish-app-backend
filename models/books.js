const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
})

const repliesSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
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
  _id: {
    type: mongoose.Schema.Types.ObjectId,
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
  likedBy: {
    type: [userSchema],
    required: false,
  },
  dateCreated: {
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
  approval: {
    type: String,
    required: true,
    default: 'review',
  },
  publishDate: {
    type: String,
    required: true,
  },
  status: { type: String, required: true, default: 'ongoing' },
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
