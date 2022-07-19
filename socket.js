const { Server } = require('socket.io')
const mongoose = require('mongoose')
const Users = require('./models/users')
const Books = require('./models/books')
const Authors = require('./models/author')
const io = new Server()
const db = mongoose.connection
const data = {}
db.on('connected', async () => {
  io.on('connection', (socket) => {
    socket.on('connect', () => console.log(socket.id))
    socket.on('getNotif', async (userId) => {
      data[userId] = socket.id
      const books = await db.collection('books')
      const bookWatch = books.watch()
      bookWatch.on('change', async (d) => {
        const updated = d.updateDescription.updatedFields
        const updateId = d.documentKey._id
        const book = await Books.findOne({ _id: updateId })

        if (updated.comments) {
          const users = await Users.find({})
          let notifs = []

          for (comments of updated.comments) {
            let replies = []
            let firstImage = null
            for (let x of comments.replies) {
              if (x._id.toString() !== userId) {
                let dataU = users.find(
                  (d) => d._id.toString() === x._id.toString()
                )
                if (firstImage === null || firstImage === undefined)
                  firstImage = dataU.img
                replies.push(dataU.username)
              }
            }
            console.log('h')
            notifs.push({
              what: 'comment',
              bookImg: book.bookCoverImg,
              book: book.bookName,
              username: replies,
              image: firstImage,
            })
          }
          socket.to(data[userId]).emit('notification', notifs)
        }
      })
    })
    socket.on('disconnect', () => {})
  })
})
module.exports = {
  io,
}
