import { useEffect, useMemo, useState } from 'preact/hooks'
import './app.scss'
import 'bootstrap'
import { Generator } from './utils/classes'

import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { ChatBoxProvider, useChatBox } from './contexts/ChatBoxContext'
import ChatBox from './components/ChatBox'
import JBButton from './components/JBButton'
import { DOWNLOAD_TYPES, downloadWrapper } from './utils/export'
import AudioRecorder from './components/AudioRecorder'
export const chatgpt = new Generator()

export function App() {
  return <MainLayout />
}

function ChatForm() {
  const { chatBoxs, addChatBox, updateChatBox } = useChatBox()
  const [jb, setJB] = useState(false)
  const [loading, setLoading] = useState<boolean>()
  const [systemText, setSystemText] = useState<string>()
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
    setLoading(true)
    const aChatBox = addChatBox({
      loading: true,
      text: '',
      role: 'assistant'
    })!
    try {
      const payloadMessages = chatBoxs.map((chatBox) => {
        return {
          role: chatBox.role,
          content: chatBox.text
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
    } catch (error) {
      // TODO: fix the following in react
      // if (targetTextArea)
      //   targetTextArea.value = 'Error fetching response.\n\n' + error
    } finally {
      // TODO: fix the following in react
      // utils.removeSpinner()
      // let lastMessage = apiResponse?.result ? addMessage() : targetTextArea
      // if (lastMessage) lastMessage.focus()
      aChatBox.loading = false
      updateChatBox(aChatBox)
      setLoading(false)
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
            <ChatBox key={index} {...chatBox} submit={handleSubmit} />
          ))}
      </div>
      {loading && <Loading />}

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
          const res = await chatgpt.stt(file)
          if (res) {
            const text = res.text
            addChatBox({ text, role: 'user' })
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
  /*
  function addChatBox(message = '', setAsAssistant?: boolean) {
    const systemRole = Generator.roles.system.role
    const userRole = Generator.roles.user.role
    const assistantRole = Generator.roles.assistant.role

    let newRole = setAsAssistant ? assistantRole : userRole
    let lastChatBox: aChatBox,
      messageInput: HTMLTextAreaElement = undefined as any
    if (ChatBoxs.length > 0) {
      lastChatBox = ChatBoxs[ChatBoxs.length - 1]
      if (typeof setAsAssistant === 'undefined') {
        const lastRoleType = lastChatBox.role || assistantRole
        const isUser = lastRoleType === userRole
        if (typeof setAsAssistant != 'undefined')
          newRole = isUser ? assistantRole : userRole
      }
      if (lastChatBox.text.length == 0) {
        console.log('editing last message')
        lastChatBox.text = message
        updateChatBox(ChatBoxs.length - 1, lastChatBox)
        const preview = setPreviewDiv(messageInput)
        if (newRole == userRole) showTextArea(preview, messageInput)
        return messageInput
      }
    }

    // add message here

    const drawContainer = document.createElement('div')
    drawContainer.className = 'input-group draw-container'

    const drawings = document.createElement('div')
    drawings.className = 'drawings row'
    drawContainer.append(drawings)
    for (const type of ['m', 'd']) {
      const drawBtn = document.createElement('button')
      drawBtn.type = 'button'
      drawBtn.className = 'btn form-button draw-btn btn-dark'
      drawBtn.title = 'Draw a pic'
      drawBtn.dataset.type = type
      drawBtn.innerText = type == 'm' ? 'Draw 🎇 M' : 'Draw 🌠 D'
      drawContainer.append(drawBtn)
      drawButtonEventListener(drawBtn)
    }
    inputGroup.append(drawContainer)

    messageInput.value = message
    messagesContainer.append(inputGroup)
    messageInput.dispatchEvent(new Event('input', { bubbles: true }))
    const preview = setPreviewDiv(messageInput)
    if (newRole == userRole) showTextArea(preview, messageInput)
    return messageInput
  }
*/
  return (
    <div class="mb-3 p-0">
      <button
        class="btn btn-dark btn-sm"
        type="button"
        title="Add new message"
        id="add-message"
        onClick={(e) => {
          addChatBox()
        }}
      >
        + Add message
      </button>
    </div>
  )
}
function MainLayout() {
  useEffect(() => {
    // Setup logic to replace init()
  }, [])

  return (
    <div class="main-layout">
      <div class="container">
        <ChatBoxProvider>
          <ChatForm />
        </ChatBoxProvider>
        <button
          type="button"
          class="btn btn-secondary reload"
          onClick={() => window.location.reload()}
        >
          <span class="fas fa-sync"></span>
        </button>
        <div id="model-name">{chatgpt.model}</div>
      </div>
    </div>
  )
}
