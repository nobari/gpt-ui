import { FunctionComponent, createContext } from 'preact'
import { useContext, useEffect, useRef, useState } from 'preact/hooks'

export type aChatBox = {
  index: number
  text: string
  base64String?: string
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
}
const initialChatBox = {
  index: 0,
  role: 'user'
} as aChatBox

const ChatBoxContext = createContext<ChatBoxContextType>(undefined!)
// Create a context

export const ChatBoxProvider: FunctionComponent = ({ children }) => {
  const [chatBoxs, setChatBoxs] = useState<aChatBox[]>([initialChatBox])
  const chatBoxsRef = useRef(chatBoxs)

  // Update the ref whenever chatBoxs changes
  useEffect(() => {
    chatBoxsRef.current = chatBoxs
  }, [chatBoxs])

  useEffect(() => {
    const handleFocus = () => {
      if (chatBoxsRef.current.length > 0) {
        const lastChatBox = chatBoxsRef.current[chatBoxsRef.current.length - 1]
        console.log('lastChatBox', lastChatBox)
        
      }
    }

    window.addEventListener('focus', handleFocus)

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
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
  }

  const value = { chatBoxs, addChatBox, updateChatBox, deleteChatBox }

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
