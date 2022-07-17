const mongoose = require('mongoose')

const librarySchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  dateAdded: {
    type: Date,
    required: true,
    default: Date.now,
  },
})
const otpSchema = new mongoose.Schema({
  otp: {
    type: String,
    required: true,
  },
  exp: {
    type: Date,
    required: true,
    default: new Date(new Date().setMinutes(new Date().getMinutes() + 5)),
  },
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
      unique: true,
    },
    dropDups: true,
  },
  experience: {
    type: Number,
    required: true,
    default: 0,
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
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dateVerified: {
    type: Date,
    required: false,
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
  verification: {
    type: otpSchema,
    required: false,
  },
})

module.exports = mongoose.model('Users', userSchema)
