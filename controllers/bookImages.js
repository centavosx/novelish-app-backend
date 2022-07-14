const multer = require('multer')
const fs = require('fs')
const BookImages = require('../models/bookImages')
const storage = multer.diskStorage({
  destination: function (req, file, cb, res) {
    cb(null, './bookFiles')
  },
  filename: function (req, file, cb, res) {
    cb(null, file.originalname)
  },
})
const uploadImg = multer({ storage: storage }).single('image')

const addImage = async (req) => {
  const obj = {
    img: {
      data: fs.readFileSync('./bookFiles/' + req.file.filename),
      contentType: req.file.mimetype,
    },
  }
  const image = new BookImages(obj)
  const newImage = await image.save()
  return (
    req.protocol + '://' + req.get('host') + '/images/books/' + newImage._id
  )
}

const getImage = async (req, res) => {
  try {
    const data = await BookImages.findById(req.params.id)
    return res
      .status(200)
      .contentType(data.img.contentType)
      .send(new Buffer.from(data.img.data, 'binary'))
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}
module.exports = {
  uploadImg,
  addImage,
  getImage,
}
