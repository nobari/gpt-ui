import { useRef, useState } from 'preact/hooks'
import { useChatBox } from '../contexts/ChatBoxContext'
import {
  transcribeTextFromImage,
  transcribeTextFromAudio,
} from '../utils/google'

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Supported file formats
const SUPPORTED_FORMATS = {
  image: 'PNG, JPEG, GIF, BMP, WEBP',
  audio: 'WAV, MP3, FLAC, OGG, WEBM (up to 10MB)',
}

export function OCRButton({
  setLoading,
}: {
  setLoading: (loading: boolean) => void
}) {
  const { addChatBox } = useChatBox()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [processingProgress, setProcessingProgress] = useState(0)

  // Set up event listeners for progress updates
  const setupProgressListener = () => {
    const handleProgressUpdate = (event: CustomEvent) => {
      const { status, progress } = event.detail
      if (status) setProcessingStatus(status)
      if (progress) setProcessingProgress(progress)
    }

    window.addEventListener(
      'audio-transcription-progress',
      handleProgressUpdate as EventListener
    )

    return () => {
      window.removeEventListener(
        'audio-transcription-progress',
        handleProgressUpdate as EventListener
      )
    }
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLoading(true)
    setIsProcessing(true)
    setProcessingStatus('Preparing file...')
    setProcessingProgress(0)

    // Set up progress listener
    const removeListener = setupProgressListener()

    try {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `File size exceeds the maximum limit of ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`
        )
      }

      console.log(
        `Processing ${file.type} file: ${file.name} (${(
          file.size / 1024
        ).toFixed(2)}KB)`
      )

      let text = ''

      if (file.type.startsWith('audio/')) {
        setProcessingStatus('Transcribing audio...')

        // For larger audio files, update the status to indicate it might take time
        if (file.size > 1024 * 1024) {
          setProcessingStatus(
            'Processing longer audio file (this may take a minute)...'
          )
        }

        text = (await transcribeTextFromAudio(file)) || ''
      } else if (file.type.startsWith('image/')) {
        setProcessingStatus('Extracting text from image...')
        text = (await transcribeTextFromImage(file)) || ''
      } else {
        throw new Error(
          `Unsupported file type: ${file.type}. Supported image formats: ${SUPPORTED_FORMATS.image}. Supported audio formats: ${SUPPORTED_FORMATS.audio}.`
        )
      }

      if (text) {
        setProcessingStatus('Adding to chat...')
        addChatBox({
          chatbox: {
            previewing: true, //to avoid focusing or opening keyboard
            text,
            role: 'user',
          },
        })
      } else {
        console.error('No text was transcribed from the file')
        alert(
          'No text could be transcribed from the file. Please try a different file or format.'
        )
      }
    } catch (err) {
      console.error('Error processing file:', err)
      alert(`Error processing file: ${err}`)
    } finally {
      setLoading(false)
      setIsProcessing(false)
      setProcessingStatus('')
      setProcessingProgress(0)
      // Remove the progress listener
      removeListener()
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Format the status message with progress if available
  const getStatusMessage = () => {
    if (!processingStatus) return 'Processing...'
    if (processingProgress > 0) {
      return `${processingStatus} (${processingProgress}%)`
    }
    return processingStatus
  }

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={() => fileInputRef.current?.click()}
      disabled={isProcessing}
      title={`Extract text from images (${SUPPORTED_FORMATS.image}) or audio (${SUPPORTED_FORMATS.audio})`}
    >
      {isProcessing ? getStatusMessage() : 'OCR/ACR'}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/wav,audio/mp3,audio/ogg,audio/flac,audio/webm"
        onChange={handleFileUpload}
        hidden
        id="fileInput"
      />
    </button>
  )
}
