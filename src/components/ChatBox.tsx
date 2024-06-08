import { FC, ForwardedRef, forwardRef } from 'preact/compat'
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'preact/hooks'
import { aChatBox, useChatBox } from '../contexts/ChatBoxContext'
import { Generator, VOICES } from '../utils/classes'
import { copyTextToClipboard } from '../utils/utils'
import 'katex/dist/katex.min.css'

import { chatgpt } from '../app'
import DrawContainer from './DrawContainer'
import TextareaAutosize from 'react-textarea-autosize'
import ChatBoxPreview from './ChatBoxPreview'

interface ChatBoxProps extends aChatBox {
  setAsAssistant?: boolean
  deleteChatBox: (index: number) => void
  submit: () => void
  forwardedRef?: any
}

const getPlaceholder = (fetching = false, role: string) => {
  return fetching
    ? 'Fetching response...'
    : role === Generator.roles.user.role
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
    const userRole = Generator.roles.user.role
    const assistantRole = Generator.roles.assistant.role
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
          disabled={audioLoading}
          className="btn form-button play-btn btn-dark"
          type="button"
          title="Play"
          hidden={!!audioUrl}
          onClick={async (e) => {
            setAudioLoading(true)
            const textToSpeech = text.trim()
            log('text:', textToSpeech)
            const audioUrl = await chatgpt.tts(textToSpeech)
            console.log('audio url:', audioUrl)
            setAudioUrl(audioUrl)
            setAudioLoading(false)
          }}
        >
          <span className={`fas ${audioLoading ? 'fa-spinner' : 'fa-play'}`} />
        </button>
        <div class="d-inline-flex align-items-center gap-2">
          <label htmlFor="voiceSelect" class="form-label">
            🔊
          </label>
          <select
            className="form-select"
            id="voiceSelect"
            value={chatgpt.selectedVoice}
            onChange={(e: any) => {
              chatgpt.selectedVoice = e.target.value
              setAudioUrl(undefined)
            }}
          >
            {VOICES.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={`btn ${base64String ? 'btn-secondary' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className={`fa-image ${base64String ? 'far' : 'fas'}`} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSubmit}
          style={{ display: 'none' }}
          id="fileInput"
        />
        <div className="audio-container d-flex justify-content-center align-items-center">
          <audio
            hidden={!audioUrl}
            src={audioUrl}
            controls={!!audioUrl}
            ref={audioRef}
            className="form-control" // This class adds Bootstrap styling
            style={{ width: '100%' }} // Ensure the audio control spans the full width of its container
          />
        </div>
        <DrawContainer toShake={toShake} prompt={text} />
      </div>
    )
  }
)

export default ChatBox
