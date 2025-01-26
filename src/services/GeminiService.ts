import {
  GenerateContentStreamResult,
  GoogleGenerativeAI,
} from '@google/generative-ai'
import { AIService } from './AIService'
import { AIConfig, AIMessage } from '../types/ai.types'

export class GeminiService extends AIService {
  private client: GoogleGenerativeAI
  private stream?: GenerateContentStreamResult

  constructor(config: AIConfig) {
    super(config)
    this.client = new GoogleGenerativeAI(config.apiKey)
  }

  async generateText(messages: AIMessage[]): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ model: this.config.model })

      // Convert messages to Gemini format
      const prompt = messages.map((m) => m.content).join('\n')

      this.stream = await model.generateContentStream(prompt)
      let responseText = ''

      for await (const chunk of this.stream.stream) {
        const text = chunk.text() ?? ''
        responseText += text
      }

      return responseText.trim()
    } catch (error) {
      throw new Error(`Gemini text generation failed: ${error}`)
    }
  }

  async nextText(
    messages: AIMessage[],
    currentChatBox: any,
    update: (chatBox: any) => void,
    toJB: boolean = false
  ): Promise<{ result: boolean; response: string }> {
    try {
      const model = this.client.getGenerativeModel({ model: this.config.model })

      // Convert messages to Gemini format
      const prompt = messages.map((m) => m.content).join('\n')

      this.stream = await model.generateContentStream(prompt)
      let responseText = ''

      for await (const chunk of this.stream.stream) {
        const text = chunk.text() ?? ''
        console.log(text)
        responseText += text
        currentChatBox.text += text
        currentChatBox.previewing = true
        update(currentChatBox)
      }

      return { result: true, response: responseText.trim() }
    } catch (error) {
      const errorMsg = `${error}`
      console.error(error)
      return { result: false, response: errorMsg }
    }
  }

  stopGeneration(): void {
    if (this.stream?.stream) {
      this.stream.stream.return
    }
  }
}
