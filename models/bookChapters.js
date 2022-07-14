const mongoose = require('mongoose')
const { commentSchema } = require('./books')
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
const updateSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
})
const chapterSchema = new mongoose.Schema({
  chapterNumber: {
    type: Number,
    required: true,
  },
  chapterName: {
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
  approval: {
    type: String,
    required: true,
    default: 'review',
  },
  publishDate: {
    type: Date,
    required: true,
  },
  isPublished: {
    type: Boolean,
    required: true,
  },
  readBy: { type: [userSchema], required: false },
  unlockedBy: { type: [userSchema], required: false },
  comments: { type: [commentSchema], required: false },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updateHistory: { type: [updateSchema], required: false },
})
const bookChapterSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  chapters: { type: [chapterSchema], required: false },
})

module.exports = mongoose.model('Chapters', bookChapterSchema)
