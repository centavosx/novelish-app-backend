const paypal = require('paypal-rest-sdk')
const Transactions = require('../models/transactions')
const Coins = require('../models/coinPrice')
const Users = require('../models/users')

const getCoins = async (req, res) => {
  try {
    const coins = await Coins.find({})
    return res.json({ coins, coin: req.userCoin, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res.status(403).json({
      success: false,
      message: 'An error has occurred',
      tkn: req.tkn,
      rtkn: req.rtkn,
    })
  }
}

const success = async (req, res) => {
  try {
    const payerId = req.query.PayerID
    const paymentId = req.query.paymentId
    const execute_payment_json = {
      payer_id: payerId,
    }
    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      async (err, payment) => {
        if (err) return res.render('cancelled')
        const check = await Transactions.findOne({
          paypalId: payment.id,
          refId: payment.transactions[0].related_resources[0].sale.id,
        })
        if (check) return res.render('cancelled')
        const coin = await Coins.findOne({
          name: payment.transactions[0].item_list.items[0].name,
        })
        if (!coin) return res.render('cancelled')
        const users = await Users.findOne(
          { _id: payment.transactions[0].description },
          { coin: 1 }
        )

        const userCoin = users.coin
        users.coin = userCoin + coin.coin
        console.log(users.coin, payment.transactions[0].description, userCoin)
        const trans = {
          paypalId: payment.id,
          cartId: payment.cart,
          paymentMethod: payment.payer.payment_method,
          dateCreated: new Date(payment.update_time),
          total: payment.transactions[0].amount.total,
          currency: payment.transactions[0].amount.currency,
          userId: payment.transactions[0].description,
          item: payment.transactions[0].item_list.items[0].name,
          refId: payment.transactions[0].related_resources[0].sale.id,
          transaction: 'online',
          coin: coin.coin,
        }

        const transactions = new Transactions(trans)
        await users.save()
        await transactions.save()
        return res.render('success')
      }
    )
  } catch (e) {
    return res.render('cancelled')
  }
}

const pay = async (req, res) => {
  try {
    const coin = await Coins.findOne({ name: req.body.name })
    if (!coin)
      return res.json(403).json({
        message: 'Invalid coin to purchase',
        tkn: req.tkn,
        rtkn: req.rtkn,
      })

    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal',
      },
      redirect_urls: {
        return_url:
          req.protocol + '://' + req.get('host') + '/transactions/success',
        cancel_url:
          req.protocol + '://' + req.get('host') + '/transactions/cancelled',
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: coin.name,
                sku: coin._id.toString(),
                price: coin.price,
                currency: 'USD',
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: 'USD',
            total: coin.price,
          },
          description: req.userId,
        },
      ],
    }

    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error)
        return res
          .status(500)
          .json({ message: err.message, tkn: req.tkn, rtkn: req.rtkn })

      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          return res.json({
            url: payment.links[i].href,
            tkn: req.tkn,
            rtkn: req.rtkn,
          })
        }
      }
      return res
        .status(400)
        .json({ message: 'Error has occurred', tkn: req.tkn, rtkn: req.rtkn })
    })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transactions.find({ userId: req.userId })
    return res.json({
      trans: transactions.slice(
        req.params.start,
        req.params.end === 'all' ? transactions.length : req.params.end
      ),
      coin: req.userCoin,
      tkn: req.tkn,
      rtkn: req.rtkn,
    })
  } catch (e) {
    return res
      .status(500)
      .json({ message: 'Error has occurred', tkn: req.tkn, rtkn: req.rtkn })
  }
}

module.exports = {
  pay,
  success,
  getTransactions,
  getCoins,
}
