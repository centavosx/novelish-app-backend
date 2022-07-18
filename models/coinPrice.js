const mongoose = require('mongoose')

const coinSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  bonusCoin: {
    type: Number,
    required: true,
  },
  coin: {
    type: Number,
    required: true,
  },
})

module.exports = mongoose.model('Coins', coinSchema)
