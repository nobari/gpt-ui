import CryptoJS from 'crypto-js'
export function encryptDecrypt(
  plainOrEncryptedString: string,
  performEncryption = false,
  key?: string
) {
  try {
    const userHash = generateUserHash(key).toString()
    if (performEncryption)
      return CryptoJS.AES.encrypt(plainOrEncryptedString, userHash).toString()
    return CryptoJS.AES.decrypt(plainOrEncryptedString, userHash).toString(
      CryptoJS.enc.Utf8
    )
  } catch (error) {
    return plainOrEncryptedString
  }
}

export function encrypt(plainString: string, key?: string) {
  const userHash = generateUserHash(key).toString()
  return CryptoJS.AES.encrypt(plainString, userHash).toString()
}

export function decrypt(encryptedString: string, key?: string) {
  const userHash = generateUserHash(key).toString()
  return CryptoJS.AES.decrypt(encryptedString, userHash).toString(
    CryptoJS.enc.Utf8
  )
}

// Generate a hash based on the user's browser and machine properties
function generateUserHash(key?: string) {
  const userAgent = navigator.userAgent
  const platform =
    userAgent.indexOf('Win') !== -1
      ? 'Windows'
      : userAgent.indexOf('Mac') !== -1
      ? 'MacOS'
      : userAgent.indexOf('X11') !== -1
      ? 'UNIX'
      : userAgent.indexOf('Linux') !== -1
      ? 'Linux'
      : 'Unknown OS'
  const hashInput = key || userAgent + platform
  const hash = CryptoJS.SHA256(hashInput) // use a cryptographic hash function (e.g. SHA-256) to generate a hash
  return hash
}
