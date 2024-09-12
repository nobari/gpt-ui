import { useEffect, useRef, useState } from 'preact/hooks'
import { aChatBox, useChatBox } from '../contexts/ChatBoxContext'
import { getMemory, getTitle, parseMemory } from '../utils/utils'
import queryString from 'query-string'

type TMemories = { title: string; memory: string }[]
const ShowMemories = ({
  memories,
  setMemories
}: {
  memories: TMemories
  setMemories: (memories: TMemories) => void
}) => {
  const { setChatBoxs, setSystemText } = useChatBox()
  const [showModal, setShowModal] = useState(false)
  const handleClose = () => setShowModal(false)
  const handleShow = () => setShowModal(true)
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
    <>
      <button type="button" className="btn btn-info btn-sm" onClick={handleShow}>
        Show Memories
      </button>
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
                  <h5>{obj.title}</h5>
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
    </>
  )
}
export const SaveMemory = () => {
  const { chatBoxs, systemText } = useChatBox()
  const [memories, setMemories] = useState<TMemories>([])
  const saveToLocalStorage = () => {
    const memory = getMemory(chatBoxs, systemText)
    if (!memory) {
      window.alert('Write something first!')
      return
    }
    const title = getTitle(chatBoxs)
    const existingMemoryIndex = memories.findIndex((obj) => obj.title === title)
    if (existingMemoryIndex !== -1) {
      window.alert('Memory already exists! But updated anyway.')
      memories[existingMemoryIndex].memory = memory
      storeMemories([...memories])
    } else {
      storeMemories([...memories, { title, memory }])
    }
  }
  const storeMemories = (newMemories: typeof memories) => {
    setMemories(newMemories)
    localStorage.setItem('memories', JSON.stringify(newMemories))
  }
  useEffect(() => {
    const memories = localStorage.getItem('memories')
    if (memories) {
      const parsedMemories = JSON.parse(memories)
      setMemories(parsedMemories)
    }
  }, [])
  const toastRef = useRef<HTMLDivElement>(null)
  const shareAndCopy = () => {
    const memory = getMemory(chatBoxs, systemText)
    if (!memory) {
      window.alert('Write something first!')
      return
    }

    const newQueryString = queryString.stringify({
      memory
    })
    // add memory as the search param of the current url
    const url = `${window.location.href}?${newQueryString}`
    console.log(url)
    navigator.clipboard.writeText(url).then(() => {
      if (toastRef.current) {
        toastRef.current.classList.add('show')
      }
    })
  }

  return (
    <div>
      <ShowMemories memories={memories} setMemories={setMemories} />
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
