import { HTMLAttributes, FC, useState } from 'preact/compat'
import { chatgpt, CONFIGS } from '../utils/gpt'

interface DrawContainerProps extends HTMLAttributes<HTMLDivElement> {
  prompt?: string
  toShake: () => void
}

const useDrawContainer = ({ prompt, toShake }: DrawContainerProps) => {
  const [images, setImages] = useState<
    { config: typeof CONFIGS.image; url?: string }[]
  >([])
  const draw = async (e: Event) => {
    const config = CONFIGS.image
    e.preventDefault()
    if (!prompt) return toShake()
    // const existingImgs = dalle.generatedImgs;// drawEl.querySelectorAll(".img-wrapper").length;
    // const collectionId = Date.now();
    const ids: number[] = []
    const offset = images.length
    for (let i = 0; i < config.n!; i++) {
      ids.push(i + offset)
      images.push({ config })
    }
    setImages([...images])
    try {
      const gens = await chatgpt.getImages(prompt!, config)
      if (!gens.length) throw 'no image'
      setImages((img) => {
        let imagesId = 0
        ids.forEach((id) => {
          img[id].url = gens[imagesId++]
        })
        return [...img]
      })
    } catch (e) {
      console.log('error images:', e)
    }
  }
  const drawButton = (
    <button
      type="button"
      className="btn form-button draw-btn btn-dark btn-sm"
      title="Draw"
      onClick={draw}
    >
      Draw 🌠
    </button>
  )
  const drawContainer = (
    <div className="d-flex justify-content-center gap-2">
      {images && (
        <div className="drawings row">
          {images.map((image, index) => (
            <div key={index} className="card col-md-6 img-wrapper">
              <img
                id={`image-${index}`}
                src={image.url || 'imgs/loading.gif'}
                className="card-img-top"
                alt={`image ${index + 1}`}
              />
              <div className="card-body">
                <p className="card-text">
                  <button
                    disabled={!image.url}
                    className="btn btn-outline-success btn-circle btn-sm"
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = image.url!
                      link.download = `sapata_${image.config.type}_${
                        index + 1
                      }.jpg`
                      document.body.appendChild(link) // Required for Firefox
                      link.click()
                      document.body.removeChild(link) // Required for Firefox
                    }}
                  >
                    <span className="fas fa-download"></span>
                  </button>
                  {`${image.config.type}-${index + 1}`}
                  <button
                    disabled={!image.url}
                    className="btn btn-outline-danger btn-circle btn-sm"
                    type="button"
                    onClick={() => {
                      const newImages = images.filter(
                        (_, imgIndex) => imgIndex !== index
                      )
                      setImages(newImages)
                    }}
                  >
                    <span className="fas fa-trash-alt"></span>
                  </button>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
  return { drawButton, drawContainer }
}

export default useDrawContainer

/*

 function drawButtonEventListener(btn: HTMLButtonElement) {
    btn.addEventListener('click', async (e) => {
      if (e.target) {
        const el = (e.target as any).closest('.chat-box')
        if (!el) return
        const txt = el.querySelector('textarea.message-text').value
        if (!txt.length) {
          return window.alert('write something first')
        }
        const drawEl = el.querySelector('.draw-container .drawings')
        btn.disabled = true
        await draw(txt, drawEl, btn.dataset.type as any)
        btn.disabled = false
      }
    })
  }


 
*/
