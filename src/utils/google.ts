import { CONFIGS } from './classes'

export async function translateTextFromImage(
  file: File,
  targetLanguage: string
) {
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
    const detections = visionData.responses[0].textAnnotations
    const text = detections[0].description
    console.log(`Detected text: ${text}`)
    return text
    // Translate the text using Google Translate API
    const translateResponse = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: targetLanguage,
          format: 'text'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    const translateData = await translateResponse.json()
    const translation = translateData.data.translations[0].translatedText
    console.log(`Translation: ${translation}`)
  } catch (err) {
    console.error('ERROR:', err)
  }
}
