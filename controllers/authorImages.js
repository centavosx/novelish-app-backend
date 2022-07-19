const multer = require('multer')
const fs = require('fs')
const AuthorImages = require('../models/authorImages')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './authorFiles')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})
const uploadImg = multer({ storage: storage }).array('image')

const addImage = async (req, i) => {
  const obj = {
    img: {
      data: fs.readFileSync('./authorFiles/' + req.files[i].filename),
      contentType: req.files[i].mimetype,
    },
  }
  const image = new AuthorImages(obj)
  const newImage = await image.save()
  return (
    req.protocol + '://' + req.get('host') + '/authors/images/' + newImage._id
  )
}

const getImage = async (req, res) => {
  try {
    const data = await AuthorImages.findById(req.params.id)
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
