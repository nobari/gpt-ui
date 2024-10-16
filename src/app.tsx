import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import './app.scss'
import 'bootstrap'
import { chatgpt } from './utils/gpt'

import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { ChatBoxProvider, useChatBox } from './contexts/ChatBoxContext'
import ChatBox from './components/ChatBox'
import JBButton from './components/JBButton'
import AudioRecorder from './components/AudioRecorder'
import Footer from './components/Footer'
import { setDocumentTitle } from './utils/utils'
import { Accordion } from './components/Accordion'
import { AdvancedOptions } from './components/AdvancedOptions'

export function App() {
  return <MainLayout />
}

function ChatForm() {
  const { chatBoxs, addChatBox, updateChatBox, deleteChatBox, systemText } =
    useChatBox()
  const [jb, setJB] = useState(false)
  const [loading, setLoading] = useState<number>(-1)

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
              setLoading={setLoading}
            />
          ))}
      </div>
      {loading >= 0 && <Loading />}

      <div class="d-flex justify-content-center gap-2 mb-3 w-100" role="group">
        <JBButton
          onChange={(checked) => {
            setJB(checked)
          }}
        />
        <button
          class="btn btn-primary w-100"
          title="Ctrl + Enter"
          type="submit"
          id="submit"
        >
          Generate <span className="fas fa-paper-plane"></span>
        </button>
      </div>
      <RecordingSection />
      <AudioRecorder
        onRecorded={async (url, file) => {
          console.log(url, file)
          setLoading(chatBoxs.length)
          const text = await chatgpt.stt(file)
          setLoading(-1)
          if (text) {
            addChatBox({ chatbox: { text, role: 'user' } })
            setDocumentTitle(chatBoxs)
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
    <div class="mb-3 p-0 d-flex align-items-center gap-2 justify-content-between">
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

          <Accordion title="Advanced Options" id="advancedOptions">
            <AdvancedOptions />
            <Footer />
          </Accordion>
        </ChatBoxProvider>
      </div>
    </div>
  )
}
