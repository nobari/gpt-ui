import { aChatBox } from '../contexts/ChatBoxContext'
import LZString from 'lz-string'

export function deleteMessage(messageToDelete: HTMLButtonElement) {
  try {
    if (document.querySelectorAll('.chat-box').length > 1)
      messageToDelete.parentElement?.remove()
    else window.alert('no more message to remove')
  } catch (err) {
    console.error('Error deleting message:', err)
  }
}

export function disableOrEnableElements(disable = true) {
  const buttons = document.querySelectorAll(
    'button'
  ) as NodeListOf<HTMLButtonElement>
  const textAreas = document.querySelectorAll(
    'textarea'
  ) as NodeListOf<HTMLTextAreaElement>
  const elements = [...buttons, ...textAreas]
  const filteredElements = Array.from(elements).filter(
    (element) => !element.classList.contains('is-disabled')
  )
  filteredElements.forEach((element) => {
    element.disabled = disable
  })
}

export function addSpinner(messagesContainer: HTMLDivElement): HTMLDivElement {
  disableOrEnableElements(true)
  const placeholderDiv = document.createElement('div')
  placeholderDiv.id = 'placeholderDiv'
  const stopGeneratingButton = document.createElement('button')
  stopGeneratingButton.className = 'btn btn-danger btn-sm mb-2 mt-2'
  stopGeneratingButton.textContent = 'Stop Generating'
  stopGeneratingButton.style.display = 'block'
  stopGeneratingButton.type = 'button'
  stopGeneratingButton.id = 'stopGenerationBtn'

  const loadingParagraph = document.createElement('p')
  loadingParagraph.textContent = 'Fetching response'
  loadingParagraph.className = 'loading'
  placeholderDiv.appendChild(loadingParagraph)
  placeholderDiv.appendChild(stopGeneratingButton)
  messagesContainer.appendChild(placeholderDiv)
  return placeholderDiv
}

export function removeSpinner() {
  const spinnerDiv = document.getElementById('placeholderDiv')
  if (spinnerDiv) spinnerDiv.remove()
  disableOrEnableElements(false)
}

export function getDateTimeStrings() {
  const now = new Date()
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }
  // @ts-ignore
  const dateString = now
    .toLocaleDateString(undefined, dateOptions)
    .replace(/\//g, '-')
  // @ts-ignore
  const timeString = now
    .toLocaleTimeString(undefined, timeOptions)
    .replace(/:/g, '-')
  return { dateString, timeString }
}

export function createDownloadLink(filename: string, data: any, type: string) {
  const blob = new Blob([data], {
    type
  })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
  a.remove()
}

export function showModal(
  titleString = '',
  bodyString = '',
  buttonString = '',
  closeButtonString = 'Close',
  buttonFunction: any = null
) {
  const title = document.getElementById('modalTitle') as HTMLHeadingElement
  const body = document.getElementById('modalBody') as HTMLDivElement
  const button = document.getElementById('modalButton') as HTMLButtonElement
  const closeButton = document.getElementById(
    'modalCloseButton'
  ) as HTMLButtonElement

  title.textContent = titleString
  body.innerHTML = bodyString
  button.textContent = buttonString
  closeButton.textContent = closeButtonString || 'Close'

  if (!buttonString) {
    button.style.display = 'none'
  } else {
    button.style.display = 'block'
    if (buttonFunction != null) {
      button.addEventListener('click', (e) => {
        buttonFunction('adfree.html')
      })
    }
  }
  // @ts-ignore
  const myModal = new bootstrap.Modal(document.getElementById('modal'))
  // @ts-ignore
  myModal.show()
}

// function to navigate to a url
export const navigateTo = (url: string) => {
  window.location.href = url
}

function fallbackCopyTextToClipboard(text: string) {
  var textArea = document.createElement('textarea')
  textArea.value = text

  // Avoid scrolling to bottom
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    var successful = document.execCommand('copy')
    var msg = successful ? 'successful' : 'unsuccessful'
    console.log('Fallback: Copying text command was ' + msg)
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err)
  }

  document.body.removeChild(textArea)
}
export function copyTextToClipboard(text: string) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text)
    return
  }
  navigator.clipboard.writeText(text).then(
    function () {
      console.log('Async: Copying to clipboard was successful!')
    },
    function (err) {
      console.error('Async: Could not copy text: ', err)
    }
  )
}

export const getMemory = (chatBoxs: aChatBox[], systemText: string) => {
  if (chatBoxs.length == 1 && !chatBoxs[0].text && !chatBoxs[0].base64String)
    return
  const memorizedChatBoxs = JSON.stringify({
    s: systemText,
    c: chatBoxs.map((chatBox) => ({
      text: chatBox.text,
      role: chatBox.role,
      base64String: chatBox.base64String,
      previewing: chatBox.previewing,
      index: chatBox.index
    }))
  })
  const memory = LZString.compressToEncodedURIComponent(memorizedChatBoxs)
  return memory
}

export const parseMemory = (memory: string) => {
  try {
    if (memory) {
      const decompressedMemory = LZString.decompressFromEncodedURIComponent(
        memory as string
      )
      console.log('decompressedMemory:', decompressedMemory)
      if (decompressedMemory) {
        const parsedMemory: { s: string; c: aChatBox[] } =
          JSON.parse(decompressedMemory)
        return parsedMemory
      }
    }
  } catch (e) {
    console.error('Error parsing memory:', e)
  }
}
export const getTitle = (chatBoxs: aChatBox[]) => {
  return chatBoxs?.[0]?.text?.trim() || 'Sapata | ChatGPT'
}
export const setDocumentTitle = (chatBoxs: aChatBox[]) => {
  document.title = getTitle(chatBoxs)
}
