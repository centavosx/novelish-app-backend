const Authors = require('../models/author')

const { addImage } = require('./authorImages')
const { isRequired } = require('./comments')

const { sendEmail } = require('../mail')

const addAuthor = async (req, res) => {
  try {
    if (
      !isRequired([
        req.files,
        req.params.id,
        req.body.name,
        req.body.penName,
        req.body.bio,
        req.body.email,
      ])
    )
      return res.status(500).json({ message: 'Please fill up all the blanks' })
    const img = await addImage(req, 0)
    const digital = await addImage(req, 1)
    const id = await addImage(req, 2)

    if (
      await sendEmail(
        req.body.email,
        'You have been approved to become an author',
        `<body>
        <h1>Good day ${req.body.name}!!!</h1>
        <br/>
        <h4>We have good news for you. You have been approved as an author in Novelish, you may login your account as a writer with a Pen Named: <b><i>${req.body.penName}</i></b>
        </h4>
        <h4>Thank you very much! Have fun writing your own book!</h4>
      </body>`
      )
    ) {
      const author = new Authors({
        _id: req.params.id,
        name: req.body.name,
        penName: req.body.penName,
        bio: req.body.bio,
        email: req.body.email,
        digitalSignatureUrl: digital,
        idPicUrl: id,
        img: img,
      })
      const newUser = await author.save()
      delete newUser['password']
      return res.json({ registered: true })
    }
    return res.json({ message: 'Failed' })
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
}

const insertProfilePicture = async (req, res) => {
  try {
    if (!isRequired([req.file]))
      return res
        .status(500)
        .json({ message: 'Please add a file', tkn: req.tkn, rtkn: req.rtkn })
    const userData = await Users.findById(req.userId)
    const newFileUrl = await addImage(req)
    if (typeof userData.img !== 'undefined') {
      let splitImg = userData.img.split('/')
      let id = splitImg[splitImg.length - 1]
      await UserImages.deleteOne({ _id: id })
    }
    const d = await Users.updateOne({ _id: req.userId }, { img: newFileUrl })
    res.json({ ...d, tkn: req.tkn, rtkn: req.rtkn })
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message, tkn: req.tkn, rtkn: req.rtkn })
  }
}

module.exports = {
  addAuthor,

  insertProfilePicture,
}
