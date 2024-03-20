
let lastRecStopTime = 0
function setRecorder() {
  const recordButton = document.getElementById('recordButton')!
  const audioPlayback = document.getElementById(
    'audioPlayback'
  ) as HTMLAudioElement
  let mediaRecorder: MediaRecorder | undefined
  let audioChunks: BlobPart[] = []
  let isRecording = false
  function startRecording(stream: MediaStream) {
    const now = Date.now()
    console.log('startRecording:' + now)
    if (now - lastRecStopTime < 1000) {
      alert("You're recording too fast!")
      return
    }
    isRecording = true
    mediaRecorder = new MediaRecorder(stream)
    if (!mediaRecorder) {
      alert('MediaRecorder is not defined')
      return
    }
    mediaRecorder.start()
    recordButton
      .querySelector('span')
      ?.classList.replace('fa-microphone', 'fa-circle-stop')
    recordButton.classList.add('btn-success')
    recordButton.classList.remove('btn-danger')

    mediaRecorder.addEventListener('dataavailable', (event) => {
      audioChunks.push(event.data)
    })

    mediaRecorder.addEventListener('stop', function stopped(this) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)
      const audioFile = new File([audioBlob], 'filename.wav', {
        type: 'audio/wav'
      })
      // Dispatch the custom 'recorded' event with the audio URL
      const recordedEvent = new CustomEvent('recorded', {
        detail: { audioUrl, audioFile }
      })
      document.dispatchEvent(recordedEvent)
      audioPlayback.src = audioUrl
      this.stream.getTracks().forEach((track) => track.stop())

      audioPlayback.classList.remove('d-none')
      audioChunks = []
      recordButton
        .querySelector('span')
        ?.classList.replace('fa-circle-stop', 'fa-microphone')
      recordButton.classList.add('btn-danger')
      recordButton.classList.remove('btn-success')
    })
  }

  function stopRecording() {
    const now = Date.now()
    console.log('stopRecording:' + now)
    lastRecStopTime = now
    if (!mediaRecorder) {
      console.error('MediaRecorder is not defined')
      return
    }
    mediaRecorder.stop()
  }

  recordButton.addEventListener('mousedown', function () {
    if (!isRecording) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(startRecording)
        .catch((error) => {
          console.error('Error accessing the microphone', error)
        })
    }
  })

  recordButton.addEventListener('mouseup', function () {
    if (isRecording) {
      stopRecording()
      isRecording = false
    }
  })

  // For touch devices
  recordButton.addEventListener('touchstart', function (e) {
    e.preventDefault()
    recordButton.dispatchEvent(new Event('mousedown'))
  })

  recordButton.addEventListener('touchend', function (e) {
    e.preventDefault()
    recordButton.dispatchEvent(new Event('mouseup'))
  })
}
