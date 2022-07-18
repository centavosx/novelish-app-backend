const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  paypalId: {
    type: String,
    required: false,
  },
  cartId: {
    type: String,
    requred: false,
  },
  paymentMethod: {
    type: String,
    required: false,
  },
  dateCreated: {
    type: String,
    required: true,
    default: Date.now,
  },
  total: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: false,
  },
  userId: {
    type: String,
    required: true,
  },
  item: {
    type: String,
    required: true,
  },
  refId: {
    type: String,
    required: true,
  },
  transaction: {
    type: String,
    required: true,
  },
  coin: {
    type: Number,
    required: true,
  },
})

module.exports = mongoose.model('Transactions', transactionSchema)
