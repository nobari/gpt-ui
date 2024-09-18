import { forwardRef } from 'preact/compat'
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'preact/hooks'
import { aChatBox, useChatBox } from '../contexts/ChatBoxContext'
import { roles } from '../utils/gpt'
import { copyTextToClipboard } from '../utils/utils'
import 'katex/dist/katex.min.css'

import { chatgpt } from '../utils/gpt'
import TextareaAutosize from 'react-textarea-autosize'
import ChatBoxPreview from './ChatBoxPreview'
import { OCRButton } from './OCRButton'
import useDrawContainer from '../hooks/useDrawContainer'
import { EVENTS } from '../utils/events'

interface ChatBoxProps extends aChatBox {
  setAsAssistant?: boolean
  deleteChatBox: (index: number) => void
  submit: () => void
  forwardedRef?: any
}

const getPlaceholder = (fetching = false, role: string) => {
  return fetching
    ? 'Fetching response...'
    : role === roles.user.role
    ? 'Type your message here'
    : 'Enter an assistant message here.'
}

const ChatBox = forwardRef<{ focusTextbox: () => void }, ChatBoxProps>(
  (
    {
      index,
      text,
      role,
      previewing,
      setAsAssistant,
      shaking,
      loading,
      setLoading,
      base64String,
      submit,
      deleteChatBox
    },
    ref
  ) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null)
    const [audioLoading, setAudioLoading] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string>()
    const { updateChatBox } = useChatBox()
    const userRole = roles.user.role
    const assistantRole = roles.assistant.role
    const focusTextbox = () => {
      textAreaRef.current?.focus()
    }
    useEffect(() => {
      // Apply conditional focusing based on the role and previewing state
      if (role !== 'assistant' && !previewing && textAreaRef.current) {
        focusTextbox()
      }
    }, [role, previewing]) // Depend on role and previewing to re-evaluate when they change
    useImperativeHandle(ref, () => ({
      focusTextbox
    }))
    const toShake = () => {
      shaking = true
      update({ shaking })
      setTimeout(() => {
        shaking = false
        update({ shaking })
      }, 500)
    }
    const log = (...msg: any) => {
      //if dev, log to console
      if (import.meta.env.DEV) {
        console.log(`chatbox ${index}:`, ...msg)
      }
    }

    const placeholder = useMemo(() => {
      if (loading && role == 'assistant') return 'Fetching response...'
      return getPlaceholder(setAsAssistant, role)
    }, [setAsAssistant, role, loading])

    const update = (aChatBox: Partial<aChatBox>) => {
      // log('update chatbox:', aChatBox)
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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const handleFileSubmit = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      try {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = function (event: any) {
            const base64String = `data:image/jpeg;base64,${
              event.target.result.split(',')[1]
            }`
            console.log('Base64 string of file:', base64String)
            update({ base64String })
          }
          reader.readAsDataURL(file)
        }
      } catch (err) {
        console.error(err)
      } finally {
      }
    }
    const playAudio = async (e: any) => {
      e.preventDefault()
      setAudioLoading(true)
      const textToSpeech = text.trim()
      log('text:', textToSpeech)
      const audioUrl = await chatgpt.tts(textToSpeech)
      console.log('audio url:', audioUrl)
      setAudioUrl(audioUrl)
      setAudioLoading(false)
    }
    const { drawButton, drawContainer } = useDrawContainer({
      toShake,
      prompt: text
    })
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
            const newText = e.target.value
            update({ text: newText })
            if (index === 0) {
              window.dispatchEvent(new Event(EVENTS.UPDATE_TITLE))
            }
            if (audioUrl) setAudioUrl(undefined)
          }}
          value={text}
          ref={textAreaRef}
          // ref={(textArea: HTMLTextAreaElement | null) => {
          //   textAreaRef.current = textArea
          //   if (!textArea) return
          //   if (role != 'assistant' && !previewing) textArea.focus()
          // }}
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

        <div className="chat-box-actions d-flex overflow-x-auto my-2 pb-2 h-48">
          <button
            className="btn form-button copy-btn btn-dark btn-sm"
            type="button"
            title="Copy to clipboard"
            onClick={async (e) => {
              copyTextToClipboard(text)
            }}
          >
            <span className="fas fa-clipboard" /> Copy
          </button>

          <div className="d-inline-flex align-items-center gap-0 mx-2">
            <button
              id="playButton"
              disabled={audioLoading}
              className="btn form-button play-btn btn-dark btn-sm"
              type="button"
              title="Play"
              onClick={playAudio}
            >
              <span
                className={`fas ${
                  audioUrl
                    ? 'fa-refresh'
                    : audioLoading
                    ? 'fa-spinner'
                    : 'fa-play'
                }`}
              />
            </button>
            <audio
              hidden={!audioUrl}
              src={audioUrl}
              controls={!!audioUrl}
              ref={audioRef}
            />
          </div>

          <button
            type="button"
            title={`${base64String ? 'Change image' : 'Upload image'}`}
            className={`btn-dark btn btn-sm ${
              base64String ? 'btn-secondary' : ''
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={`fa-image ${base64String ? 'far' : 'fas'}`} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSubmit}
              hidden
              id="fileInput"
            />
          </button>

          <OCRButton
            setLoading={(loading) => setLoading(loading ? index : -1)}
          />
          {drawButton}
        </div>
        {drawContainer}
      </div>
    )
  }
)

export default ChatBox
