import { aChatBox } from '../contexts/ChatBoxContext'
import * as templates from './templates'
import * as utils from './utils'
import { marked } from 'marked'

const htmlTemplate = templates.html
const pythonTemplate = templates.python

const brandLineMd = `Sapata`
export type DOWNLOAD_TYPES = 'html' | 'md' | 'py'
export function downloadWrapper(chatBoxs: aChatBox[], type: DOWNLOAD_TYPES) {
  const text = chatBoxs
    .map((c) => {
      const value = c.text.trim()
      if (!value) return ''
      return `**${c.role}**\n\n${value}\n\n---\n\n`
    })
    .join('')
  if (!text) return window.alert('write something first')
  let downloadType = 'text/html'
  const { dateString, timeString } = utils.getDateTimeStrings()
  let filename = `chatgpt-${dateString}-${timeString}.`
  let fileContent = ''
  switch (type) {
    case 'html':
      fileContent = downloadHTML(text, dateString, timeString)
      filename += 'html'
      break
    case 'md':
      downloadType = 'text/plain'
      fileContent = downloadMarkdown(text, dateString, timeString)
      filename += 'md'
      break
    case 'py':
      fileContent = downloadPython(text, dateString, timeString)
      filename += 'py'
      break
  }
  utils.createDownloadLink(filename, fileContent, downloadType)
}

function downloadMarkdown(
  text: string,
  dateString: string,
  timeString: string
) {
  const markdownText = `${text}\n\n${brandLineMd} on ${dateString} at ${timeString}`
  return markdownText
}

function downloadHTML(text: string, dateString: string, timeString: string) {
  // @ts-ignore
  text = marked.parse(
    `${text}\n\n${brandLineMd} on ${dateString} at ${timeString}`
  )
  text = htmlTemplate.replace('<!-- replace me  -->', text)
  return text
}

function downloadPython(text: string, dateString: string, timeString: string) {
  const pythonCode = pythonTemplate.replace('<!-- messages  -->', text)
  return pythonCode
}
