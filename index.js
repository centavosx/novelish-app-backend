const express = require('express')
const app = express()

const { decryptText } = require('./encryption')

const mongoose = require('mongoose')
const booksRouter = require('./routes/books')
const commentsRouter = require('./routes/comments')
const imageRouter = require('./routes/images')
const bodyParser = require('body-parser')
const cors = require('cors')
const userRouter = require('./routes/users')
const path = require('path')
require('dotenv').config()
mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
app.use(express.static(path.join(__dirname, '..', 'public')))
db.on('error', (error) => console.log(error))
db.once('open', () => console.log('Connected'))

app.use(express.json())
app.use(
  bodyParser.json({
    limit: '50mb',
  })
)
app.use(cors())

app.use('/books', booksRouter)
app.use('/comments', commentsRouter)
app.use('/images', imageRouter)
app.use('/users', userRouter)
app.get('/', (req, res) => res.send('TEST'))
app.listen(3000, () => console.log('Started'))
