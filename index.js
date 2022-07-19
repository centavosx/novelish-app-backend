const express = require('express')
const app = express()

const { decryptText } = require('./encryption')

const mongoose = require('mongoose')
const paypal = require('paypal-rest-sdk')
const booksRouter = require('./routes/books')
const commentsRouter = require('./routes/comments')
const imageRouter = require('./routes/images')
const paypalRouter = require('./routes/paypal')
const rewardsRouter = require('./routes/rewards')
const authorRouter = require('./routes/authors')
const bodyParser = require('body-parser')
const { io } = require('./socket.js')
const cors = require('cors')
const userRouter = require('./routes/users')
const http = require('http')
const engines = require('consolidate')

require('dotenv').config()
mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
const server = http.createServer(app)
io.attach(server)
app.engine('ejs', engines.ejs)
app.set('views', './views')
app.set('view engine', 'ejs')

db.on('error', (error) => console.log(error))
db.once('open', () => console.log('Connected'))

paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENTID,
  client_secret: process.env.PAYPAL_CLIENTSECRET,
})

app.use(express.json())
app.use(
  bodyParser.json({
    limit: '50mb',
  })
)
app.use(cors())

app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    parameterLimit: 100000,
    extended: false,
  })
)

app.use(function async(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  )
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
})

app.use('/books', booksRouter)
app.use('/comments', commentsRouter)
app.use('/transactions', paypalRouter)
app.use('/images', imageRouter)
app.use('/rewards', rewardsRouter)
app.use('/authors', authorRouter)
app.use('/users', userRouter)
app.get('/', (req, res) => res.send('TEST'))
server.listen(process.env.PORT || 3000, () => console.log('Started'))
