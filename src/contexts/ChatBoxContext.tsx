import { FunctionComponent, createContext } from 'preact'
import { useContext, useState } from 'preact/hooks'

export type aChatBox = {
  index: number
  text: string
  previewing?: boolean
  role: string
  //UI props
  shaking?: boolean
  loading?: boolean
}

interface ChatBoxContextType {
  chatBoxs: aChatBox[]
  addChatBox: (chatbox?: Partial<aChatBox>) => aChatBox | void
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

  const addChatBox = (newChatBox?: Partial<aChatBox>) => {
    console.log(`addChatBox ${chatBoxs.length}:`, newChatBox)
    if ((!newChatBox || newChatBox.role === 'user') && chatBoxs.length > 0) {
      const lastChatBox = chatBoxs[chatBoxs.length - 1]
      if (lastChatBox.role === 'user' && !lastChatBox.text) {
        if (newChatBox?.text) {
          lastChatBox.text = newChatBox.text
          updateChatBox(lastChatBox)
          return lastChatBox
        }
        lastChatBox.shaking = true
        updateChatBox(lastChatBox)
        setTimeout(() => {
          lastChatBox.shaking = false
          updateChatBox(lastChatBox)
        }, 500)
        // window.alert('Please enter your message first')
        return
      }
    }
    const chatBoxToAdd = {
      text: '',
      role: 'user',
      ...newChatBox
    } as aChatBox
    setChatBoxs((prevChatBox) => {
      if (!chatBoxToAdd.index) chatBoxToAdd.index = prevChatBox.length
      chatBoxs.push(chatBoxToAdd)
      console.log(
        'addChatBox: prevChatBox:',
        prevChatBox,
        'chatboxes:',
        chatBoxs
      )
      return chatBoxs
    })
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
