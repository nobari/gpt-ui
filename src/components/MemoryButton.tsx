import { useEffect, useRef, useState } from 'preact/hooks'
import { useChatBox } from '../contexts/ChatBoxContext'
import { getTitle, parseMemory, updateURL } from '../utils/utils'

type TMemories = { title: string; memory: string }[]
const ShowMemories = ({
  memories,
  setMemories,
  showModal,
  handleClose
}: {
  memories: TMemories
  setMemories: (memories: TMemories) => void
  showModal: boolean
  handleClose: () => void
}) => {
  const { setChatBoxs, setSystemText } = useChatBox()
  const handleRestore = (memory: string) => {
    const parsedMemory = parseMemory(memory)
    if (!parsedMemory) return
    setChatBoxs(parsedMemory.c)
    setSystemText(parsedMemory.s)
    handleClose()
  }
  const handleDelete = (index: number) => {
    const newMemories = memories.filter((_, i) => i !== index)
    setMemories(newMemories)
  }
  if (memories.length === 0) return null
  return (
    <div
      className={`modal fade ${showModal ? 'show' : ''}`}
      style={{ display: showModal ? 'block' : 'none' }}
      tabIndex={showModal ? 0 : -1}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header d-flex justify-content-between">
            <h5 className="modal-title">Memories</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            >
              <span aria-hidden="true">
                <span className="fas fa-close"></span>
              </span>
            </button>
          </div>
          <div className="modal-body">
            {memories.map((obj, index) => (
              <div
                key={index}
                className="memory-item d-flex gap-2 justify-content-between mb-2"
              >
                <h5>{`${obj.title.substring(0, 70)}${
                  obj.title.length > 70 ? '...' : ''
                }`}</h5>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleRestore(obj.memory)}
                  >
                    <span className="fas fa-undo"></span> restore
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(index)}
                  >
                    <span className="fas fa-trash"></span> delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
export const SaveMemory = () => {
  const { chatBoxs, systemText } = useChatBox()
  const [showModal, setShowModal] = useState(false)
  const handleClose = () => setShowModal(false)
  const [stale_memories, setMemories] = useState<TMemories>([])
  const saveToLocalStorage = () => {
    const { memory } = updateURL(chatBoxs, systemText)
    if (!memory) {
      window.alert('Write something first!')
      return
    }
    const title = getTitle(chatBoxs)
    const memories = fetchMemories()
    const existingMemoryIndex = memories.findIndex((obj) => obj.title === title)
    if (existingMemoryIndex !== -1) {
      window.alert('Memory already exists! But updated anyway.')
      memories[existingMemoryIndex].memory = memory
      storeMemories([...memories])
    } else {
      storeMemories([...memories, { title, memory }])
    }
  }
  const fetchMemories = () => {
    let memories: TMemories = []
    const memoriesSTR = localStorage.getItem('memories')
    if (memoriesSTR) {
      memories = JSON.parse(memoriesSTR)
      setMemories(memories)
    }
    return memories
  }
  useEffect(() => {
    fetchMemories()
  }, [])
  const storeMemories = (newMemories: TMemories) => {
    setMemories(newMemories)
    localStorage.setItem('memories', JSON.stringify(newMemories))
  }
  const toastRef = useRef<HTMLDivElement>(null)
  const shareAndCopy = () => {
    const { url } = updateURL(chatBoxs, systemText)

    navigator.clipboard.writeText(url).then(() => {
      if (toastRef.current) {
        toastRef.current.classList.add('show')
      }
    })
  }
  const handleShow = () => {
    fetchMemories()
    setShowModal(true)
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-info btn-sm"
        onClick={handleShow}
      >
        Show Memories
      </button>
      <ShowMemories
        memories={stale_memories}
        setMemories={setMemories}
        showModal={showModal}
        handleClose={handleClose}
      />
      <button
        type="button"
        title="Save to local storage"
        className="btn btn-dark btn-sm"
        onClick={() => {
          saveToLocalStorage()
        }}
      >
        <span className="fas fa-save"></span> Save Locally
      </button>
      {/* share button */}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => {
          shareAndCopy()
        }}
      >
        <span className="fas fa-share"></span> Share
      </button>
      {/* Toast notification */}
      <div
        ref={toastRef}
        className="toast position-fixed p-3"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{ zIndex: 11 }}
      >
        <button
          type="button"
          className="btn-close btn-sm position-absolute top-0 end-0 m-2"
          data-bs-dismiss="toast"
          aria-label="Close"
        ></button>
        <div className="toast-body">copied to clipboard 📋 ready to share</div>
      </div>
    </div>
  )
}
