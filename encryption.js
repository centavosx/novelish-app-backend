const CryptoJS = require('crypto-js')

const encryptText = (d = '') => {
  const salt = CryptoJS.lib.WordArray.random(128 / 8)
  const iv = CryptoJS.lib.WordArray.random(128 / 8)
  console.log(d)
  const key = CryptoJS.PBKDF2(process.env.KEY_VALUE, salt, {
    keySize: 128 / 32,
  })

  const encrpyted = CryptoJS.AES.encrypt(d, key, { iv: iv })
  const final = salt.toString() + iv.toString() + encrpyted.toString()
  return final
}
const decryptText = (d = '') => {
  const salt = CryptoJS.enc.Hex.parse(d.substring(0, 32))
  const iv = CryptoJS.enc.Hex.parse(d.substring(32, 64))
  const encrypted = d.substring(64)

  const key = CryptoJS.PBKDF2(process.env.KEY_VALUE, salt, {
    keySize: 128 / 32,
  })

  const decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv: iv })
  return decrypted.toString(CryptoJS.enc.Utf8)
}

module.exports = {
  encryptText,
  decryptText,
}
