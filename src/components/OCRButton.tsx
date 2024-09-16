import { useRef } from 'preact/hooks'
import { chatgpt } from '../utils/gpt'
import { useChatBox } from '../contexts/ChatBoxContext'
import { transcribeTextFromImage } from '../utils/google'

export function OCRButton({
  setLoading
}: {
  setLoading: (loading: boolean) => void
}) {
  const { addChatBox } = useChatBox()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLoading(true)
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
      setLoading(false)
    }
  }
  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={() => fileInputRef.current?.click()}
    >
      OCR/ACR
      <input
        ref={fileInputRef}
        type="file"
        // accept="image/*"
        onChange={handleFileUpload}
        hidden
        id="fileInput"
      />
    </button>
  )
}
