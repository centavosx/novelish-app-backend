const mongoose = require('mongoose')

const chapterSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  coin: {
    type: Number,
    required: true,
  },
  dateAdded: { type: Date, required: true, default: Date.now },
})

const librarySchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  display: {
    type: Boolean,
    required: true,
    default: true,
  },
  dateAdded: {
    type: Date,
    required: true,
    default: Date.now,
  },
  chaptersUnlocked: { type: [chapterSchema], required: false },
})

const attendanceSchema = new mongoose.Schema({
  dateCreated: { type: Date, required: true, default: Date.now },
})

module.exports = mongoose.model('Transactions', userSchema)
