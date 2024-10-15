import { FunctionComponent, createContext } from 'preact'
import { useContext, useEffect, useRef, useState } from 'preact/hooks'
import { useLocation } from 'react-router-dom'
import queryString from 'query-string'
import { parseMemory, setDocumentTitle, updateURL } from '../utils/utils'
import { EVENTS } from '../utils/events'

export type aChatBox = {
  index: number
  text: string
  base64String?: string
  setLoading: (loading: number) => void
  previewing?: boolean
  role: string
  //UI props
  shaking?: boolean
  loading?: boolean
}

interface ChatBoxContextType {
  chatBoxs: aChatBox[]
  addChatBox: ({
    chatbox,
    passive
  }: {
    chatbox?: Partial<aChatBox>
    passive?: boolean
  }) => aChatBox | void
  updateChatBox: (chatbox: Partial<aChatBox>) => void
  deleteChatBox: (index: number) => void
  systemText: string
  setSystemText: (systemText: string) => void
  setChatBoxs: (chatBoxs: aChatBox[]) => void
}
const initialChatBox = {
  index: 0,
  role: 'user'
} as aChatBox

const ChatBoxContext = createContext<ChatBoxContextType>(undefined!)
// Create a context

export const ChatBoxProvider: FunctionComponent = ({ children }) => {
  const location = useLocation()
  const [chatBoxs, setChatBoxs] = useState<aChatBox[]>([initialChatBox])
  const [systemText, setSystemText] = useState<string>('')
  const chatBoxsRef = useRef(chatBoxs)
  const systemTextRef = useRef(systemText)

  const updateMemory = () =>
    setTimeout(() => {
      updateURL(chatBoxsRef.current, systemTextRef.current)
    }, 300) // 300ms delay to ensure the chatBoxs and systemText are updated

  useEffect(() => {
    const memory = queryString.parse(location.search).memory
    const parsedMemory = parseMemory(memory as string)
    if (parsedMemory) {
      setSystemText(parsedMemory.s)
      setChatBoxs(parsedMemory.c)
    }
    window.addEventListener(EVENTS.UPDATE_URL_MEMORY, updateMemory)
    window.addEventListener(EVENTS.UPDATE_TITLE, () => {
      console.log(`event:${EVENTS.UPDATE_TITLE}`)
      setDocumentTitle(chatBoxsRef.current)
    })
  }, [])
  // Update the ref whenever chatBoxs changes
  useEffect(() => {
    chatBoxsRef.current = chatBoxs
  }, [chatBoxs])
  useEffect(() => {
    systemTextRef.current = systemText
  }, [systemText])

  const addChatBox = ({
    chatbox,
    passive
  }: { chatbox?: Partial<aChatBox>; passive?: boolean } = {}) => {
    const currentChatBoxs = chatBoxsRef.current // Use ref to access the current chat boxes
    if (passive) {
      console.log(`addChatBox passive ${currentChatBoxs.length}:`, chatbox)
      if (currentChatBoxs[currentChatBoxs.length - 1].role != 'assistant')
        return
    }
    console.log(`addChatBox ${currentChatBoxs.length}:`, chatbox)
    if ((!chatbox || chatbox.role === 'user') && currentChatBoxs.length > 0) {
      const lastChatBox = currentChatBoxs[currentChatBoxs.length - 1]
      if (lastChatBox.role === 'user' && !lastChatBox.text) {
        if (chatbox?.text) {
          lastChatBox.text = chatbox.text
          updateChatBox(lastChatBox)
          return
        }
        lastChatBox.shaking = true
        updateChatBox(lastChatBox)
        setTimeout(() => {
          lastChatBox.shaking = false
          updateChatBox(lastChatBox)
        }, 500)
        return
      }
    }
    const chatBoxToAdd = {
      index: currentChatBoxs.length,
      text: '',
      role: 'user',
      ...chatbox
    } as aChatBox
    setChatBoxs([...currentChatBoxs, chatBoxToAdd])
    updateMemory()
    return chatBoxToAdd
  }

  const updateChatBox = (newChatBox: Partial<aChatBox>) => {
    setChatBoxs((prevChatBoxs) => {
      const indexToUpdate = newChatBox.index || 0
      Object.assign(prevChatBoxs[indexToUpdate], newChatBox)
      return [...prevChatBoxs]
    })
  }
  const deleteChatBox = (index: number) => {
    if (chatBoxs.length === 1) {
      window.alert(`Please don't delete the last chat box`)
      return
    }
    setChatBoxs((prevChatBox) => {
      const newChatBoxs = [...prevChatBox]
      newChatBoxs.splice(index, 1)
      for (let i = index; i < newChatBoxs.length; i++) {
        newChatBoxs[i].index = i
      }
      return newChatBoxs
    })
    updateMemory()
  }

  const value = {
    chatBoxs,
    addChatBox,
    updateChatBox,
    deleteChatBox,
    systemText,
    setSystemText,
    setChatBoxs
  }

  return (
    <ChatBoxContext.Provider value={value}>{children}</ChatBoxContext.Provider>
  )
}

// Create a custom hook to use the shared context
export const useChatBox = () => {
  const context = useContext(ChatBoxContext)

  if (context === undefined) {
    throw new Error('useChatBox must be used within a ChatBoxProvider')
  }

  return context
}
