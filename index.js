const express = require('express')
const app = express()

const mongoose = require('mongoose')
const booksRouter = require('./routes/books')
const commentsRouter = require('./routes/comments')
const imageRouter = require('./routes/images')
const userRouter = require('./routes/users')
require('dotenv').config()

mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection

db.on('error', (error) => console.log(error))
db.once('open', () => console.log('Connected'))

app.use(express.json())
app.use('/books', booksRouter)
app.use('/comments', commentsRouter)
app.use('/images', imageRouter)
app.use('/users', userRouter)
app.listen(3000, () => console.log('Started'))
