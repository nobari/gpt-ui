import { useChatBox } from '../contexts/ChatBoxContext'
import { SaveMemory } from './MemoryButton'
import { DownloadButtons } from './DownloadButtons'

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

export const AdvancedOptions = () => {
  const { systemText, setSystemText } = useChatBox()
  return (
    <div>
      <div>
        <AddMessageButton />
        <textarea
          value={systemText}
          className="form-control message-text"
          rows={1}
          spellCheck={false}
          placeholder="Any instruction? such as act as a native Japanese translator"
          onChange={(e) => {
            const value = (e.target as HTMLTextAreaElement).value.trim()
            setSystemText(value)
          }}
        ></textarea>
      </div>
      <div className="d-flex justify-content-between align-items-center z-10">
        <SaveMemory />
        <DownloadButtons />
      </div>
    </div>
  )
}
