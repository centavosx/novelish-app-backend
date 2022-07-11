const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
  tkn: {
    type: String,
    required: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
})
module.exports = new mongoose.model('Token', tokenSchema)
