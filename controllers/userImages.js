const multer = require('multer')
const fs = require('fs')
const UserImages = require('../models/userImages')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './userFiles')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})
const uploadImg = multer({ storage: storage }).single('image')

const addImage = async (req) => {
  const obj = {
    img: {
      data: fs.readFileSync('./userFiles/' + req.file.filename),
      contentType: req.file.mimetype,
    },
  }
  const image = new UserImages(obj)
  const newImage = await image.save()
  return (
    req.protocol + '://' + req.get('host') + '/images/users/' + newImage._id
  )
}

const getImage = async (req, res) => {
  try {
    const data = await UserImages.findById(req.params.id)
    res
      .status(200)
      .contentType(data.img.contentType)
      .send(new Buffer.from(data.img.data, 'binary'))
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}
module.exports = {
  uploadImg,
  addImage,
  getImage,
}
