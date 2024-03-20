import { FC, HTMLAttributes } from 'preact/compat'
import { useState, useRef } from 'preact/hooks'

interface ChatBoxPreviewProps extends HTMLAttributes<HTMLDivElement> {
  onRecorded: (url: string, file: File) => void
}
let mediaRecorder: any
let audioChunks: any

const AudioRecorder: FC<ChatBoxPreviewProps> = ({ onRecorded, ...props }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [lastRecStopTime, setLastRecStopTime] = useState(0)
  const audioPlaybackRef = useRef<HTMLAudioElement>(null)
  const recordButtonRef = useRef<HTMLButtonElement>(null)

  const startRecording = (stream: MediaStream) => {
    const now = Date.now()
    console.log('startRecording:' + now, stream)
    if (now - lastRecStopTime < 1000) {
      alert("You're recording too fast!")
      return
    }
    setIsRecording(true)
    mediaRecorder = new MediaRecorder(stream)

    if (!mediaRecorder || !recordButtonRef.current) {
      alert('MediaRecorder is not defined')
      return
    }
    audioChunks = []
    mediaRecorder.start()
    recordButtonRef.current
      .querySelector('span')
      ?.classList.replace('fa-microphone', 'fa-circle-stop')
    recordButtonRef.current.classList.add('btn-success')
    recordButtonRef.current.classList.remove('btn-danger')

    mediaRecorder.addEventListener('dataavailable', (event: any) => {
      audioChunks.push(event.data)
    })

    mediaRecorder.addEventListener('stop', () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audioFile = new File([audioBlob], 'filename.wav', {
        type: 'audio/wav'
      })
      onRecorded(audioUrl, audioFile)

      if (!audioPlaybackRef.current || !recordButtonRef.current) {
        return window.alert('error')
      }
      audioPlaybackRef.current.src = audioUrl
      mediaRecorder.stream.getTracks().forEach((track: any) => track.stop())

      audioPlaybackRef.current.classList.remove('d-none')
      audioChunks = []
      recordButtonRef.current
        .querySelector('span')
        ?.classList.replace('fa-circle-stop', 'fa-microphone')
      recordButtonRef.current.classList.add('btn-danger')
      recordButtonRef.current.classList.remove('btn-success')
    })
  }

  const stopRecording = () => {
    const now = Date.now()
    console.log('stopRecording:' + now)
    setLastRecStopTime(now)
    if (!mediaRecorder) {
      console.error('MediaRecorder is not defined')
      return
    }
    mediaRecorder.stop()
  }

  const handleRecordMouseDown = () => {
    if (!isRecording) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(startRecording)
        .catch((error) => {
          console.error('Error accessing the microphone', error)
        })
    }
  }

  const handleRecordMouseUp = () => {
    if (isRecording) {
      stopRecording()
      setIsRecording(false)
    }
  }

  return (
    <div className="audio-recorder">
      <audio
        ref={audioPlaybackRef}
        id="audioPlayback"
        controls
        className="d-none"
      ></audio>
      <button
        ref={recordButtonRef}
        onMouseDown={handleRecordMouseDown}
        onMouseUp={handleRecordMouseUp}
        onTouchStart={(e) => {
          e.preventDefault()
          handleRecordMouseDown()
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          handleRecordMouseUp()
        }}
        className="btn btn-danger"
        type="button"
      >
        <span className="fa fa-microphone"></span>
      </button>
    </div>
  )
}

export default AudioRecorder
