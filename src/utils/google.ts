import { CONFIGS } from './gpt'

// Browser-friendly implementation for Google Vision API
export async function transcribeTextFromImage(file: File) {
  try {
    const API_KEY = CONFIGS.keys.google

    // Convert File object to a Base64 string
    const base64String = await fileToBase64(file)
    const base64Content = base64String.split(',')[1]

    console.log(
      `Processing image: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`
    )

    // Performs text detection on the image file using Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Content,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 10,
                },
              ],
            },
          ],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const visionData = await visionResponse.json()
    console.log('Vision API response:', visionData)

    // Check for API errors
    if (visionData.error) {
      throw new Error(
        `API Error: ${
          visionData.error.message || JSON.stringify(visionData.error)
        }`
      )
    }

    if (!visionData.responses?.[0]?.textAnnotations) {
      // No text detected, but not an error
      console.log('No text detected in the image')
      return ''
    }

    const detections = visionData.responses[0].textAnnotations
    const text = detections[0].description
    console.log(`Detected text: ${text}`)
    return text
  } catch (err) {
    console.error('ERROR in transcribeTextFromImage:', err)
    alert(`Error processing image: ${err}`)
    return ''
  }
}

// Browser-friendly implementation for Google Speech-to-Text API
export async function transcribeTextFromAudio(
  file: File,
  sourceLanguage = 'ja-JP',
  targetLanguage?: string
) {
  try {
    const API_KEY = CONFIGS.keys.google
    console.log(
      `Processing audio: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`
    )

    // Convert File object to a Base64 string
    const base64String = await fileToBase64(file)
    const base64Content = base64String.split(',')[1]

    // Get audio format information
    const audioFormat = getAudioFormat(file.type)

    // For short audio files (< 1MB), use synchronous recognition
    if (file.size < 1024 * 1024) {
      try {
        console.log('Using synchronous recognition for small audio file')
        const text = await transcribeShortAudio(
          file,
          API_KEY,
          sourceLanguage,
          audioFormat
        )
        if (text) return text
      } catch (error) {
        const shortAudioErr = error as Error
        console.warn(
          'Short audio transcription failed, trying async method:',
          shortAudioErr
        )
        // If the error is about the file being too long, we'll use the long-running API
        if (
          shortAudioErr.message &&
          shortAudioErr.message.includes('too long')
        ) {
          console.log(
            'Audio file too long for sync API, using long-running API'
          )
        } else {
          // For other errors, we'll still try the long-running API as a fallback
          console.log('Using long-running API as fallback')
        }
      }
    } else {
      console.log('Audio file too large for sync API, using long-running API')
    }

    // Use the long-running recognition API for longer files
    return await transcribeLongAudio(file, API_KEY, sourceLanguage, audioFormat)
  } catch (err) {
    console.error('ERROR in transcribeTextFromAudio:', err)
    alert(`Error processing audio: ${err}`)
    return ''
  }
}

// Helper function for short audio files using synchronous recognition
async function transcribeShortAudio(
  file: File,
  apiKey: string,
  languageCode: string,
  audioFormat: { encoding: string; sampleRate: number }
): Promise<string> {
  // Convert File object to a Base64 string
  const base64String = await fileToBase64(file)
  const base64Content = base64String.split(',')[1]

  // Use the synchronous recognition API
  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    {
      method: 'POST',
      body: JSON.stringify({
        audio: {
          content: base64Content,
        },
        config: {
          encoding: audioFormat.encoding,
          sampleRateHertz: audioFormat.sampleRate,
          languageCode: languageCode,
          model: 'default',
          audioChannelCount: 1,
          enableAutomaticPunctuation: true,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  const data = await response.json()

  if (data.error) {
    throw new Error(
      `API Error: ${data.error.message || JSON.stringify(data.error)}`
    )
  }

  if (!data.results || data.results.length === 0) {
    return ''
  }

  return data.results
    .map((result: any) => result.alternatives?.[0]?.transcript || '')
    .join('\n')
}

// Helper function for longer audio files using long-running recognition
async function transcribeLongAudio(
  file: File,
  apiKey: string,
  languageCode: string,
  audioFormat: { encoding: string; sampleRate: number }
): Promise<string> {
  // Helper function to emit progress events
  const emitProgress = (status: string, progress: number = 0) => {
    const event = new CustomEvent('audio-transcription-progress', {
      detail: { status, progress },
    })
    window.dispatchEvent(event)
  }

  try {
    // Convert File object to a Base64 string
    const base64String = await fileToBase64(file)
    const base64Content = base64String.split(',')[1]

    // Step 1: Start the long-running operation
    emitProgress('Starting transcription service...', 5)
    console.log('Starting long-running speech recognition operation')
    const startResponse = await fetch(
      `https://speech.googleapis.com/v1/speech:longrunningrecognize?key=${apiKey}`,
      {
        method: 'POST',
        body: JSON.stringify({
          audio: {
            content: base64Content,
          },
          config: {
            encoding: audioFormat.encoding,
            sampleRateHertz: audioFormat.sampleRate,
            languageCode: languageCode,
            model: 'default',
            audioChannelCount: 1,
            enableAutomaticPunctuation: true,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const startData = await startResponse.json()
    console.log('Long-running operation started:', startData)

    if (startData.error) {
      throw new Error(
        `API Error: ${
          startData.error.message || JSON.stringify(startData.error)
        }`
      )
    }

    if (!startData.name) {
      throw new Error(
        'Failed to start long-running operation: No operation name returned'
      )
    }

    // Step 2: Poll for operation completion
    const operationName = startData.name
    console.log(`Polling operation: ${operationName}`)
    emitProgress('Processing audio...', 10)

    // Maximum number of polling attempts
    const MAX_POLLING_ATTEMPTS = 30
    // Initial delay in milliseconds
    let pollingDelay = 2000

    for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
      // Wait before polling
      await new Promise((resolve) => setTimeout(resolve, pollingDelay))

      // Increase polling delay for next attempt (exponential backoff)
      pollingDelay = Math.min(pollingDelay * 1.5, 10000) // Cap at 10 seconds

      // Calculate progress percentage (from 10% to 90%)
      const progressPercentage =
        10 + Math.floor((attempt / MAX_POLLING_ATTEMPTS) * 80)
      emitProgress(
        `Processing audio (attempt ${attempt + 1}/${MAX_POLLING_ATTEMPTS})...`,
        progressPercentage
      )

      console.log(`Polling attempt ${attempt + 1}/${MAX_POLLING_ATTEMPTS}`)

      const pollResponse = await fetch(
        `https://speech.googleapis.com/v1/operations/${operationName}?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const pollData = await pollResponse.json()
      console.log('Poll response:', pollData)

      if (pollData.error) {
        throw new Error(
          `API Error: ${
            pollData.error.message || JSON.stringify(pollData.error)
          }`
        )
      }

      // Check if operation is done
      if (pollData.done === true) {
        console.log('Long-running operation completed')
        emitProgress('Finalizing transcription...', 95)

        if (pollData.response && pollData.response.results) {
          const transcription = pollData.response.results
            .map((result: any) => result.alternatives?.[0]?.transcript || '')
            .join('\n')

          console.log(`Detected text: ${transcription}`)
          emitProgress('Transcription complete!', 100)
          return transcription
        } else {
          console.log('No transcription results found in the response')
          return ''
        }
      }

      console.log('Operation still in progress, continuing to poll...')
    }

    throw new Error(
      `Operation timed out after ${MAX_POLLING_ATTEMPTS} polling attempts`
    )
  } catch (error) {
    // Re-throw the error after emitting a progress event
    emitProgress('Error during transcription', 0)
    throw error
  }
}

// Helper function to convert File to Base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Helper function to determine audio format parameters based on MIME type
function getAudioFormat(mimeType: string): {
  encoding: string
  sampleRate: number
} {
  // Default values
  const defaultFormat = { encoding: 'LINEAR16', sampleRate: 16000 }

  // Map MIME types to Google Speech-to-Text encoding formats
  // See: https://cloud.google.com/speech-to-text/docs/encoding
  switch (mimeType.toLowerCase()) {
    case 'audio/wav':
    case 'audio/wave':
    case 'audio/x-wav':
    case 'audio/vnd.wave':
      return { encoding: 'LINEAR16', sampleRate: 16000 }
    case 'audio/ogg':
    case 'audio/ogg; codecs=opus':
    case 'application/ogg':
      return { encoding: 'OGG_OPUS', sampleRate: 48000 }
    case 'audio/mpeg':
    case 'audio/mp3':
    case 'audio/mpeg3':
      return { encoding: 'MP3', sampleRate: 16000 }
    case 'audio/flac':
    case 'audio/x-flac':
      return { encoding: 'FLAC', sampleRate: 16000 }
    case 'audio/aac':
    case 'audio/mp4':
    case 'audio/x-m4a':
    case 'audio/m4a':
      // Note: AAC is not directly supported, using AMR as fallback
      return { encoding: 'AMR', sampleRate: 8000 }
    case 'audio/webm':
    case 'audio/webm; codecs=opus':
      return { encoding: 'WEBM_OPUS', sampleRate: 48000 }
    case 'audio/l16':
    case 'audio/pcm':
      return { encoding: 'LINEAR16', sampleRate: 16000 }
    case 'audio/amr':
    case 'audio/amr-wb':
      return { encoding: 'AMR_WB', sampleRate: 16000 }
    default:
      console.warn(
        `Unknown audio format: ${mimeType}, using default encoding. This may cause transcription to fail.`
      )
      console.warn('Supported formats: WAV, FLAC, OGG_OPUS, MP3, and WEBM_OPUS')
      return defaultFormat
  }
}
