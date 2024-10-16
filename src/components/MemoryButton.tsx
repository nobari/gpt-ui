import { useEffect, useRef, useState } from 'preact/hooks'
import { useChatBox } from '../contexts/ChatBoxContext'
import { getTitle, parseMemory, updateURL } from '../utils/utils'

type TMemories = { title: string; memory: string }[]
const ShowMemories = ({
  memories,
  setMemories,
  showModal,
  handleClose,
  handleDelete
}: {
  memories: TMemories
  setMemories: (memories: TMemories) => void
  handleDelete: (index: number) => void
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
  
  const handleShow = () => {
    const memories = fetchMemories()
    if (memories.length === 0) {
      window.alert('No memories to show!')
      return
    }
    setShowModal(true)
  }
  const handleDelete = (index: number) => {
    const memories = fetchMemories()
    memories.splice(index, 1)
    storeMemories(memories)
  }
  return (
    <div className="btn-group" role="group">
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
        handleDelete={handleDelete}
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
      
    </div>
  )
}

