import { chatgpt } from '../app'
import { CONFIGS } from './classes'

export async function transcribeTextFromImage(file: File) {
  try {
    const API_KEY = CONFIGS.apiKeys.google
    // Convert File object to a Base64 string for the Google Vision API
    const reader = new FileReader()
    reader.readAsDataURL(file)
    const base64String = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
    })

    // Remove the Base64 prefix (e.g., "data:image/jpeg;base64,")
    const base64Content = base64String.split(',')[1]
    // Performs text detection on the image file using Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Content
              },
              features: [
                {
                  type: 'TEXT_DETECTION'
                }
              ]
            }
          ]
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    const visionData = await visionResponse.json()
    console.log('visionData', visionData)
    if (!visionData.responses[0].textAnnotations) {
      throw new Error('Failed to detect text')
    }
    const detections = visionData.responses[0].textAnnotations
    const text = detections[0].description
    console.log(`Detected text: ${text}`)
    return text
    // Translate the text using Google Translate API
    // const translateResponse = await fetch(
    //   `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
    //   {
    //     method: 'POST',
    //     body: JSON.stringify({
    //       q: text,
    //       source: 'en',
    //       target: targetLanguage,
    //       format: 'text'
    //     }),
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   }
    // )
    // const translateData = await translateResponse.json()
    // const translation = translateData.data.translations[0].translatedText
    // console.log(`Translation: ${translation}`)
  } catch (err) {
    console.error('ERROR:', err)
    alert(err)
  }
}

export async function transcribeTextFromAudio(
  file: File,
  sourceLanguage = 'ja-JP',
  targetLanguage?: string
) {
  try {
    const API_KEY = CONFIGS.apiKeys.google
    // Convert File object to a Base64 string for the Google Speech-to-Text API
    const reader = new FileReader()
    reader.readAsDataURL(file)
    const base64String = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string)
    })

    // Remove the Base64 prefix (e.g., "data:audio/wav;base64,")
    const base64Content = base64String.split(',')[1]

    // Performs speech recognition on the audio file using Google Speech-to-Text API
    const speechResponse = await fetch(
      `https://speech.googleapis.com/v1/speech:longrunningrecognize?key=${API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({
          audio: {
            content: base64Content
          },
          config: {
            // encoding: 'LINEAR16', // Adjust according to the audio file format
            // sampleRateHertz: 16000, // Adjust according to the audio file format
            languageCode: sourceLanguage // Adjust if you know the source language, or use 'auto'
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    const speechData = await speechResponse.json()
    const operationId = speechData.name // Get the operation ID to poll for results

    // Polling the operation status
    let transcript = ''
    do {
      const operationResponse = await fetch(
        `https://speech.googleapis.com/v1/operations/${operationId}?key=${API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      const operationData = await operationResponse.json()
      if (operationData.done) {
        transcript =
          operationData.response.results[0].alternatives[0].transcript
        break
      }
      // Wait for a while before polling again
      await new Promise((resolve) => setTimeout(resolve, 10000))
    } while (true)

    console.log(`Detected text: ${transcript}`)
    return transcript
  } catch (err) {
    console.error('ERROR:', err)
  }
}
