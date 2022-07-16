const nodemailer = require('nodemailer')
const xoauth2 = require('xoauth2')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  port: 587,
  secure: false,
  auth: {
    type: 'OAUTH2',
    user: process.env.EMAIL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.G_REFRESH,
    accessToken: process.env.G_ACCESS,
  },

  tls: {
    rejectUnauthorized: false,
  },
})

module.exports = {
  sendEmail: async (email, subject, html) => {
    try {
      let mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject,
        html,
      }
      await transporter.sendMail(mailOptions)
      return true
    } catch (e) {
      console.log(e)
      return false
    }
  },
}
