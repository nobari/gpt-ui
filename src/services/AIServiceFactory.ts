import { AIConfig } from '../types/ai.types'
import { OpenAIService } from './OpenAIService'
import { GeminiService } from './GeminiService'

export type AIServiceType = 'openai' | 'gemini'

export class AIServiceFactory {
  static create(type: AIServiceType, config: AIConfig) {
    switch (type) {
      case 'openai':
        return new OpenAIService(config)
      case 'gemini':
        return new GeminiService(config)
      default:
        return new GeminiService(config)
    }
  }
}
