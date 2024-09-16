import { useState } from 'preact/hooks'
import { version } from '../../package.json'
import { chatgpt, CONFIGS } from '../utils/gpt'

const Footer = () => {
  const availableModels: (typeof CONFIGS.text)['model'][] = [
    'chatgpt-4o-latest',
    'o1-preview',
    'chatgpt-3.5-turbo'
    // add other models here
  ]
  const availableTTSVoices: (typeof CONFIGS.tts)['voice'][] = [
    'echo',
    'fable',
    'nova',
    'onyx',
    'shimmer'
  ]

  const availableTemperatures: (typeof CONFIGS.text)['temperature'][] = [
    0.2, 0.5, 0.8, 1, 1.2, 1.5, 2
  ]
  const availableImageSizes: (typeof CONFIGS.image)['size'][] = [
    '1024x1024',
    '1024x1792',
    '1792x1024'
  ]
  const availableImageStyles: (typeof CONFIGS.image)['style'][] = [
    'vivid',
    'natural'
  ]
  const availableImageTypes: (typeof CONFIGS.image)['type'][] = ['d', 'm']
  const availableSTTModels: (typeof CONFIGS.stt)['model'][] = ['whisper-1']
  const availableTTSModels: (typeof CONFIGS.tts)['model'][] = ['tts-1-hd']

  const [selectedModel, setSelectedModel] = useState(CONFIGS.text.model)
  const [selectedTemperature, setSelectedTemperature] = useState(
    CONFIGS.text.temperature
  )
  const [selectedImageStyle, setSelectedImageStyle] = useState(
    CONFIGS.image.style
  )
  const [selectedImageType, setSelectedImageType] = useState(CONFIGS.image.type)
  const [selectedImageSize, setSelectedImageSize] = useState(CONFIGS.image.size)
  const [selectedSTTModel, setSelectedSTTModel] = useState(CONFIGS.stt.model)
  const [selectedTTSModel, setSelectedTTSModel] = useState(CONFIGS.tts.model)
  const [selectedTTSVoice, setSelectedTTSVoice] = useState(CONFIGS.tts.voice)
  const [showModal, setShowModal] = useState(false)

  const handleSave = () => {
    CONFIGS.text.model = selectedModel
    CONFIGS.text.temperature = selectedTemperature
    CONFIGS.image.type = selectedImageType
    CONFIGS.image.style = selectedImageStyle
    CONFIGS.image.size = selectedImageSize
    CONFIGS.stt.model = selectedSTTModel
    CONFIGS.tts.model = selectedTTSModel
    CONFIGS.tts.voice = selectedTTSVoice
    setShowModal(false)
  }

  return (
    <footer className="footer">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setShowModal(true)}
      >
        Settings
      </button>
      <code>v{version}</code>

      <div
        className={`modal fade ${showModal ? 'show' : ''}`}
        tabIndex={showModal ? 0 : -1}
        style={{ display: showModal ? 'block' : 'none' }}
        aria-labelledby="settingsModalLabel"
        aria-hidden={!showModal}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="settingsModalLabel">
                Settings
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {/* Text Settings */}
              <div>
                <h6>Text Settings</h6>
                <label htmlFor="modelSelect">Model:</label>
                <select
                  id="modelSelect"
                  className="form-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel((e as any).target.value)}
                >
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <label htmlFor="temperatureSelect">Temperature:</label>
                <select
                  id="temperatureSelect"
                  className="form-select"
                  value={selectedTemperature!}
                  onChange={(e) =>
                    setSelectedTemperature(parseFloat((e as any).target.value))
                  }
                >
                  {availableTemperatures.map((temp) => (
                    <option key={temp} value={temp!}>
                      {temp}
                    </option>
                  ))}
                </select>
              </div>
              {/* Image Settings */}
              <div>
                <h6>Image Settings</h6>
                <label htmlFor="imageTypeSelect">Type:</label>
                <select
                  id="imageTypeSelect"
                  className="form-select"
                  value={selectedImageType}
                  onChange={(e) =>
                    setSelectedImageType((e as any).target.value)
                  }
                >
                  {availableImageTypes.map((type) => (
                    <option key={type} value={type!}>
                      {type === 'd' ? 'DALL-E' : 'Midjourney'}
                    </option>
                  ))}
                </select>
                <label htmlFor="imageStyleSelect">Style:</label>
                <select
                  id="imageStyleSelect"
                  className="form-select"
                  value={selectedImageStyle!}
                  onChange={(e) =>
                    setSelectedImageStyle((e as any).target.value)
                  }
                >
                  {availableImageStyles.map((style) => (
                    <option key={style} value={style!}>
                      {style}
                    </option>
                  ))}
                </select>

                <label htmlFor="imageSizeSelect">Size:</label>
                <select
                  id="imageSizeSelect"
                  className="form-select"
                  value={selectedImageSize!}
                  onChange={(e) =>
                    setSelectedImageSize((e as any).target.value)
                  }
                >
                  {availableImageSizes.map((size) => (
                    <option key={size} value={size!}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              {/* STT Settings */}
              <div>
                <h6>STT Settings</h6>
                <label htmlFor="sttModelSelect">Model:</label>
                <select
                  id="sttModelSelect"
                  className="form-select"
                  value={selectedSTTModel}
                  onChange={(e) => setSelectedSTTModel((e as any).target.value)}
                >
                  {availableSTTModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              {/* TTS Settings */}
              <div>
                <h6>TTS Settings</h6>
                <label htmlFor="ttsModelSelect">Model:</label>
                <select
                  id="ttsModelSelect"
                  className="form-select"
                  value={selectedTTSModel}
                  onChange={(e) => setSelectedTTSModel((e as any).target.value)}
                >
                  {availableTTSModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <label htmlFor="ttsVoiceSelect">Voice:</label>
                <select
                  id="ttsVoiceSelect"
                  className="form-select"
                  value={selectedTTSVoice}
                  onChange={(e) => setSelectedTTSVoice((e as any).target.value)}
                >
                  {availableTTSVoices.map((voice) => (
                    <option key={voice} value={voice}>
                      {voice}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
