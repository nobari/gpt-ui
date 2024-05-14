import { HTMLAttributes, FC, useState } from 'preact/compat'
import { IMAGE_GEN_TYPES, ImageGen } from '../utils/classes'

const imageGen = new ImageGen()

interface DrawContainerProps extends HTMLAttributes<HTMLDivElement> {
  prompt?: string
  toShake: () => void
}

const DrawContainer: FC<DrawContainerProps> = ({ prompt, toShake }) => {
  const [images, setImages] = useState<
    { type: IMAGE_GEN_TYPES; url?: string }[]
  >([])
  const draw = async (e: Event, type: IMAGE_GEN_TYPES) => {
    e.preventDefault()
    if (!prompt) return toShake()
    await toDraw(type)
  }

  async function toDraw(type: IMAGE_GEN_TYPES = 'd') {
    // const existingImgs = dalle.generatedImgs;// drawEl.querySelectorAll(".img-wrapper").length;
    // const collectionId = Date.now();
    const ids: number[] = []
    const offset = images.length
    for (let i = 0; i < imageGen.n!; i++) {
      ids.push(i + offset)
      images.push({ type })
    }
    setImages([...images])
    try {
      const gens = await imageGen.getImages(prompt!, type)
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

  return (
    <div className="input-group draw-container">
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
                    className="btn btn-outline-success btn-circle"
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = image.url!
                      link.download = `sapata_${image.type}_${index + 1}.jpg`
                      document.body.appendChild(link) // Required for Firefox
                      link.click()
                      document.body.removeChild(link) // Required for Firefox
                    }}
                  >
                    <span className="fas fa-download"></span>
                  </button>
                  {`${image.type}-${index + 1}`}
                  <button
                    disabled={!image.url}
                    className="btn btn-outline-danger btn-circle"
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
      <button
        type="button"
        className="btn form-button draw-btn btn-dark"
        title="Draw a pic"
        onClick={(e) => draw(e, 'm')}
      >
        Draw 🎇 M
      </button>
      <button
        type="button"
        className="btn form-button draw-btn btn-dark"
        title="Draw a pic"
        onClick={(e) => draw(e, 'd')}
      >
        Draw 🌠 D
      </button>
    </div>
  )
}

export default DrawContainer

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
