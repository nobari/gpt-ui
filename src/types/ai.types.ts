export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content?: string | { text: string; type: string }[] | any
}

export interface AIConfig {
  apiKey: string
  model: string
  temperature?: number
}

export interface ImageGenerationConfig {
  prompt: string
  n?: number
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  responseFormat?: string
  model?: string
}

export interface AudioConfig {
  model: string
  voice?: string
  speed?: number
}

export interface AIProvider {
  generateText(messages: AIMessage[]): Promise<string>
  generateImage?(config: ImageGenerationConfig): Promise<string[]>
  transcribeSpeech?(audioFile: File): Promise<string>
  generateSpeech?(text: string): Promise<string>
  stopGeneration?(): void
}
