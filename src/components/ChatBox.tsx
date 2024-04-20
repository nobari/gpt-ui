import { FC, HTMLAttributes } from 'preact/compat'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { aChatBox, useChatBox } from '../contexts/ChatBoxContext'
import { Generator, payloadRole } from '../utils/classes'
import { copyTextToClipboard, getPreviewHtml } from '../utils/utils'
import katex from 'katex'
import 'katex/dist/katex.min.css'

import hljs from 'highlight.js'
import { chatgpt } from '../app'
import DrawContainer from './DrawContainer'
import TextareaAutosize from 'react-textarea-autosize'

interface ChatBoxProps extends aChatBox {
  setAsAssistant?: boolean
  submit: () => void
}

interface ChatBoxPreviewProps extends HTMLAttributes<HTMLDivElement> {
  text?: string
  placeholder: string
}

function highlightPreCode(htmlString: string): string {
  // Create a temporary container for the HTML content
  const tempContainer = document.createElement('div')
  tempContainer.innerHTML = htmlString

  // Find all <pre><code> blocks in the HTML
  const codeBlocks = tempContainer.querySelectorAll('pre code')

  // Highlight each code block
  codeBlocks.forEach((block) => {
    hljs.highlightElement(block as HTMLElement)
  })

  return tempContainer.innerHTML
}

const ChatBoxPreview: FC<ChatBoxPreviewProps> = ({
  text,
  placeholder,
  ...props
}) => {
  const parsed = useMemo(() => {
    const trimmedText = text?.trim()
    if (!trimmedText) return

    // Function to render math formulas using KaTeX
    const renderMath = (text: string) => {
      // This is a simplistic approach and might need adjustments based on your specific needs
      // For example, you might have math expressions delimited by $...$ or $$...$$
      return text.replace(
        /(\$\$(.*?)\$\$|\$(.*?)\$|\\\((.*?)\\\))/g,
        (match, p1, p2, p3, p4) => {
          try {
            // Choose the non-undefined group
            const formula = p2 || p3 || p4
            const result = katex.renderToString(formula, {
              throwOnError: false
            })
            console.log(`result: ${result} match: ${match} formula: ${formula}`)
            return result
          } catch (e) {
            console.error('KaTeX rendering error:', e)
            return match // Return the original string if there's an error
          }
        }
      )
    }

    // Then render math formulas within the converted HTML
    const parsedMath = renderMath(text!)
    console.log('parsedMath:', parsedMath)

    // Convert markdown to HTML first (assuming getPreviewHtml does this)
    const parsedMarkdown = getPreviewHtml(parsedMath) as string
    console.log('parsedMarkdown:', parsedMarkdown)

    return `<div>${highlightPreCode(parsedMarkdown)}</div>`
  }, [text])
  return (
    <div class="preview form-control message-text" tabIndex={0} {...props}>
      {parsed ? (
        <div dangerouslySetInnerHTML={{ __html: parsed }} />
      ) : (
        <span class="text-muted">{placeholder}</span>
      )}
    </div>
  )
}
const getPlaceholder = (fetching = false, role: string) => {
  return fetching
    ? 'Fetching response...'
    : role === Generator.roles.user.role
    ? 'Type your message here'
    : 'Enter an assistant message here.'
}

const ChatBox: FC<ChatBoxProps> = ({
  index,
  text,
  role,
  previewing,
  setAsAssistant,
  shaking,
  loading,
  submit
}) => {
  const [audioUrl, setAudioUrl] = useState<string>()
  const { deleteChatBox, updateChatBox } = useChatBox()
  const userRole = Generator.roles.user.role
  const assistantRole = Generator.roles.assistant.role
  const toShake = () => {
    shaking = true
    update({ shaking })
    setTimeout(() => {
      shaking = false
      update({ shaking })
    }, 500)
  }
  const log = (...msg: any) => {
    console.log(`chatbox ${index}:`, ...msg)
  }

  const placeholder = useMemo(() => {
    if (loading && role == 'assistant') return 'Fetching response...'
    return getPlaceholder(setAsAssistant, role)
  }, [setAsAssistant, role, loading])

  const update = (aChatBox: Partial<aChatBox>) => {
    log('update chatbox:', aChatBox)
    aChatBox.index = index
    updateChatBox(aChatBox)
  }
  useEffect(() => {
    log('shaking:', shaking)
    if (shaking) {
      previewing = false
      update({ previewing })
    }
  }, [shaking])
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      log('audioUrl:', audioUrl)
      audioRef.current.play()
    }
  }, [audioUrl])
  const audioRef = useRef<HTMLAudioElement>(null)

  return (
    <div className={`chat-box ${shaking ? 'shake' : ''}`}>
      <button
        className="btn btn-outline-secondary role-switch form-button"
        type="button"
        title="Switch Role"
        tabIndex={-1}
        onClick={() => {
          const currentRole = role
          const newRole = currentRole === userRole ? assistantRole : userRole
          update({ role: newRole })
        }}
      >
        <span
          className={`fas ${
            role == 'assistant' ? 'fa-wand-magic-sparkles' : 'fa-user-pen'
          }`}
        />
      </button>

      <ChatBoxPreview
        text={text}
        hidden={!loading && !previewing}
        placeholder={placeholder}
        onDblClick={(e) => {
          update({ previewing: false })
        }}
        onClick={() => {
          log('preview click:', previewing, role)
          if (role == 'assistant') return
          update({ previewing: false })
        }}
      />
      <TextareaAutosize
        onKeyDown={(e: any) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            const text = e.target.value
            log('submit:', text)
            e.target.blur()
            update({ text })
            submit()
          }
        }}
        onChange={(e: any) => {
          update({ text: e.target.value })
          if (audioUrl) setAudioUrl(undefined)
        }}
        value={text}
        ref={(textArea: HTMLTextAreaElement | null) => {
          if (!textArea) return
          if (role != 'assistant' && !previewing) textArea.focus()
        }}
        hidden={loading || previewing}
        onBlur={() => {
          log('text blur:', previewing)
          update({ previewing: true })
        }}
        className="form-control message-text"
        autoFocus={!previewing || role != 'assistant'}
        placeholder={placeholder}
        aria-label="message"
        rows={1}
        spellCheck={false}
      />
      <button
        className="btn btn-outline-danger message-delete form-button"
        type="button"
        title="Delete Message"
        tabIndex={-1}
        onClick={() => deleteChatBox(index)}
      >
        <span className="fas fa-trash" />
      </button>

      <button
        className="btn form-button copy-btn btn-dark"
        type="button"
        data-toggle="tooltip"
        data-placement="top"
        title="Copy to clipboard"
        onClick={async (e) => {
          copyTextToClipboard(text)
        }}
      >
        copy <span className="fas fa-clipboard" />
      </button>

      <button
        id="playButton"
        className="btn form-button play-btn btn-dark"
        type="button"
        title="Play"
        hidden={!!audioUrl}
        onClick={async (e) => {
          const textToSpeech = text.trim()
          log('text:', textToSpeech)
          const audioUrl = await chatgpt.tts(textToSpeech)
          console.log('audio url:', audioUrl)
          setAudioUrl(audioUrl)
        }}
      >
        <span className="fas fa-play" />
      </button>

      <audio
        hidden={!audioUrl}
        src={audioUrl}
        controls={!!audioUrl}
        ref={audioRef}
      />
      <DrawContainer toShake={toShake} prompt={text} />
    </div>
  )
}

export default ChatBox
