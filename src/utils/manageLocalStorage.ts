import * as crypto from './cryptography'

const LOCAL_STORAGE_API_KEY = 'sapataAPIKeys'
const LOCAL_STORAGE_MODEL_KEY = 'sapataModel'

// Get the API key from local storage
export function getAPIKeys() {
  const encryptedString = localStorage.getItem(LOCAL_STORAGE_API_KEY)
  if (encryptedString) {
    try {
      const decrypted = JSON.parse(crypto.decrypt(encryptedString))
      // console.log("api:", decryptedString);
      return decrypted
    } catch (error) {
      console.log('Error decrypting API key: ' + error)
      return ''
    }
  }
}

// Save the API key to local storage
export function setAPIKeys(keys: { openai: string; google: string }) {
  const encryptedString = crypto.encrypt(JSON.stringify(keys))
  localStorage.setItem(LOCAL_STORAGE_API_KEY, encryptedString)
}

// Save the model to local storage
export function setModel(model: string) {
  localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, model)
}
