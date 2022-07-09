const mongoose = require('mongoose')
const { commentSchema } = require('./books')
const chapterSchema = new mongoose.Schema({
  chapterNumber: {
    type: Number,
    required: true,
  },
  chapterName: {
    type: String,
    required: true,
  },
  what: {
    type: String,
    required: true,
  },
  chapterStory: {
    type: String,
    required: true,
  },
  coinPrice: {
    type: Number,
    required: true,
  },
  comments: { type: [commentSchema], required: false },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
})
const bookChapterSchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  chapters: { type: [chapterSchema], required: false },
})

module.exports = mongoose.model('Chapters', bookChapterSchema)
