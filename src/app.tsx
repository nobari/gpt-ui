import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import './app.scss'
import 'bootstrap'
import { Generator } from './utils/classes'

import {
  ChatCompletionMessageParam,
  ChatCompletionUserMessageParam
} from 'openai/resources/chat/completions'
import { ChatBoxProvider, useChatBox } from './contexts/ChatBoxContext'
import ChatBox from './components/ChatBox'
import JBButton from './components/JBButton'
import { DOWNLOAD_TYPES, downloadWrapper } from './utils/export'
import AudioRecorder from './components/AudioRecorder'
import { version } from '../package.json'
import { transcribeTextFromImage } from './utils/google'

export const chatgpt = new Generator()

export function App() {
  return <MainLayout />
}

function ChatForm() {
  const { chatBoxs, addChatBox, updateChatBox, deleteChatBox } = useChatBox()
  const [jb, setJB] = useState(false)
  const [loading, setLoading] = useState<number>(-1)
  const [systemText, setSystemText] = useState<string>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLoading(chatBoxs.length)
    try {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        let text = ''
        if (file.type.startsWith('audio/')) {
          text = await chatgpt.stt(file)
        } else if (file.type.startsWith('image/')) {
          text = await transcribeTextFromImage(file)
        }
        addChatBox({
          chatbox: {
            previewing: true, //to avoid focusing or opening keyboard
            text,
            role: 'user'
          }
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(-1)
    }
  }
  const handleSubmit = async (e?: any) => {
    if (e) e.preventDefault()
    console.log('submit:', chatBoxs)
    // Form submission logic
    if (chatBoxs.length === 0) {
      // This is impossible
      window.alert('please write a message first')
      return
    }
    const lastChatBox = chatBoxs[chatBoxs.length - 1]
    if (!lastChatBox.text?.trim()) {
      lastChatBox.shaking = true
      updateChatBox(lastChatBox)
      setTimeout(() => {
        lastChatBox.shaking = false
        updateChatBox(lastChatBox)
      }, 500)
      return
    }
    let apiResponse = null
    setLoading(chatBoxs.length)
    const aChatBox = addChatBox({
      chatbox: {
        loading: true,
        text: '',
        role: 'assistant'
      }
    })!
    try {
      const payloadMessages = chatBoxs.map((chatBox) => {
        return {
          role: chatBox.role,
          content: chatBox.base64String
            ? [
                {
                  text: chatBox.text,
                  type: 'text'
                },
                {
                  type: 'image_url',
                  image_url: { url: chatBox.base64String }
                }
              ]
            : chatBox.text
        } as ChatCompletionMessageParam
      })
      if (systemText)
        payloadMessages.unshift({ role: 'system', content: systemText })
      apiResponse = await chatgpt.nextText(
        payloadMessages,
        aChatBox,
        updateChatBox,
        jb
      )
    } catch (error: any) {
      aChatBox.text += `
      ---
      Error from openAI response:
      ${error?.message || error}`
    } finally {
      aChatBox.loading = false
      updateChatBox(aChatBox)
      setLoading(-1)
      addChatBox({ chatbox: { previewing: true }, passive: true })
    }
  }
  const downloadTypes = useMemo(() => {
    return (
      <ul class="dropdown-menu">
        {(['md', 'html', 'py'] as DOWNLOAD_TYPES[]).map((type) => (
          <li>
            <button
              type="button"
              class="dropdown-item p-3"
              onClick={(e) => downloadWrapper(chatBoxs, type)}
            >
              {type == 'md' ? 'Markdown' : type == 'html' ? 'HTML' : 'Python'}
            </button>
          </li>
        ))}
      </ul>
    )
  }, [chatBoxs])

  return (
    <form id="chatgpt-form" onSubmit={handleSubmit}>
      <div id="messages-container">
        {chatBoxs &&
          chatBoxs.map((chatBox, index) => (
            <ChatBox
              key={index}
              {...chatBox}
              submit={handleSubmit}
              deleteChatBox={(index: number) => {
                console.log('deleteChatBox', index)
                if (loading === index) {
                  chatgpt.stopStream()
                  setLoading(-1)
                }
                deleteChatBox(index)
              }}
            />
          ))}
      </div>
      {loading >= 0 && <Loading />}

      <div class="btn-group full-width mb-3" role="group">
        <button
          class="btn btn-success"
          title="Ctrl + Enter"
          type="submit"
          id="submit"
        >
          Answer
        </button>
        <div class="btn-group" role="group">
          <button
            type="button"
            class="btn btn-primary dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Download
          </button>
          {downloadTypes}
        </div>
        <JBButton
          onChange={(checked) => {
            setJB(checked)
          }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          OCR/ACR
        </button>
        <input
          ref={fileInputRef}
          type="file"
          // accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="fileInput"
        />
      </div>
      <RecordingSection />
      <AddMessageButton />
      <textarea
        className="form-control message-text"
        rows={1}
        spellCheck={false}
        placeholder="Any instruction? such as act as a native Japanese translator"
        onChange={(e) => {
          const value = (e.target as HTMLTextAreaElement).value.trim()
          setSystemText(value)
        }}
      ></textarea>
      <AudioRecorder
        onRecorded={async (url, file) => {
          console.log(url, file)
          const text = await chatgpt.stt(file)
          if (text) {
            addChatBox({ chatbox: { text, role: 'user' } })
          }
        }}
      />
    </form>
  )
}
function Loading() {
  return (
    <div id="placeholderDiv">
      <p className="loading">Fetching response</p>
      <button
        className="btn btn-danger btn-sm mb-2 mt-2"
        style={{ display: 'block' }}
        type="button"
        id="stopGenerationBtn"
        onClick={(e) => {
          chatgpt.stopStream()
        }}
      >
        Stop Generating
      </button>
    </div>
  )
}

function RecordingSection() {
  return (
    <div class="recording d-flex justify-content-center align-items-center my-4 gap-4">
      <audio id="audioPlayback" controls class="d-none"></audio>
    </div>
  )
}
function AddMessageButton() {
  const { addChatBox } = useChatBox()

  return (
    <div class="mb-3 p-0">
      <button
        class="btn btn-dark btn-sm"
        type="button"
        title="Add new message"
        id="add-message"
        onClick={(e) => {
          addChatBox({})
        }}
      >
        <span className="fas fa-plus" /> Add message
      </button>
    </div>
  )
}
function MainLayout() {
  useEffect(() => {
    // Setup logic to replace init()
  }, [])
  return (
    <div className="wrapper">
      <div className="container">
        <ChatBoxProvider>
          <ChatForm />
        </ChatBoxProvider>
        <button
          type="button"
          className="btn btn-secondary reload"
          onClick={() => window.location.reload()}
        >
          <span className="fas fa-sync"></span>
        </button>
        <footer className="footer">
          <code>
            <div>Model: {chatgpt.model}</div>
            <div>Version: {version}</div>
          </code>
        </footer>
      </div>
    </div>
  )
}
