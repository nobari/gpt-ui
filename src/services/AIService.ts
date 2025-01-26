import { AIConfig, AIMessage, ImageGenerationConfig } from '../types/ai.types'

export abstract class AIService {
  protected config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
  }

  abstract generateText(messages: AIMessage[]): Promise<string>

  // Optional methods that providers can implement
  nextText?(
    messages: AIMessage[],
    currentChatBox: any,
    update: (chatBox: any) => void,
    toJB?: boolean
  ): Promise<{ result: boolean; response: string }>
  generateImage?(config: ImageGenerationConfig): Promise<string[]>
  transcribeSpeech?(audioFile: File): Promise<string>
  generateSpeech?(text: string): Promise<string>
  stopGeneration?(): void
}
