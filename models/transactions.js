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

const transactionSchema = new mongoose.Schema({
  dateCreated: { type: Date, required: true, default: Date.now },
})

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    requred: false,
  },
  username: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: {
      unique: [true, 'Hello'],
    },
    dropDups: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: {
      unique: true,
    },
    dropDups: true,
  },
  password: {
    type: String,
    required: true,
  },
  coin: {
    type: Number,
    required: true,
    default: 0,
  },
  libraries: {
    type: [librarySchema],
    required: false,
  },
  transactions: { type: [transactionSchema], required: false },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    required: false,
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },
})

module.exports = mongoose.model('Users', userSchema)
