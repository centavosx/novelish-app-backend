const mongoose = require('mongoose')

const followerSchema = new mongoose.Schema({
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

const authorSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: false,
  },
  penName: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: {
      unique: true,
    },
    dropDups: true,
  },
  bio: { type: String, required: true },
  totalEarnings: { type: Number, required: true, default: 0 },
  followers: { type: [followerSchema], required: false },
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
  experience: {
    type: Number,
    required: true,
    default: 0,
  },
  dateApplied: {
    type: Date,
    required: true,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    required: false,
  },
  digitalSignatureUrl: {
    type: String,
    required: true,
  },
  idPicUrl: {
    type: String,
    required: true,
  },
})

module.exports = mongoose.model('Authors', authorSchema)
