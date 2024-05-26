import { FC, HTMLAttributes } from 'preact/compat'
import { useEffect, useMemo, useState } from 'preact/hooks'
import katex from 'katex'
import { marked } from 'marked'
import 'katex/dist/katex.min.css'

import hljs from 'highlight.js'

interface ChatBoxPreviewProps extends HTMLAttributes<HTMLDivElement> {
  text?: string
  placeholder: string
}

async function getPreviewHtml(text: string) {
  let html = await marked.parse(text)
  // Create a temporary container to manipulate the HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // Find all <p> tags and set the dir attribute to "rtl"
  tempDiv.querySelectorAll('*').forEach((el) => {
    if (/[\u0590-\u05FF\u0600-\u06FF]/.test(el.textContent || '')) {
      el.setAttribute('dir', 'rtl')
    }
  })
  // Check if all sibling elements have 'dir="rtl"' and set it on the parent if true
  tempDiv.querySelectorAll('*').forEach((element) => {
    if (element.childElementCount > 0) {
      const allChildrenRTL = Array.from(element.children).every(
        (child) => child.getAttribute('dir') === 'rtl'
      )
      if (allChildrenRTL) {
        element.setAttribute('dir', 'rtl')
        Array.from(element.children).forEach((child) => {
          child.removeAttribute('dir')
        })
      }
    }
  })

  // Return the modified HTML
  return tempDiv.innerHTML
}

function highlightPreCode(htmlString: string): string {
  // Create a temporary container for the HTML content
  const tempContainer = document.createElement('div')
  tempContainer.innerHTML = htmlString

  // Find all <pre><code> blocks in the HTML
  const codeBlocks = tempContainer.querySelectorAll('pre code')

  // Highlight each code block
  codeBlocks.forEach((block) => {
    hljs.highlightElement(block as HTMLElement)
  })

  return tempContainer.innerHTML
}

const ChatBoxPreview: FC<ChatBoxPreviewProps> = ({
  text,
  placeholder,
  ...props
}) => {
  const parsed2 = useMemo(async () => {
    const trimmedText = text?.trim()
    if (!trimmedText) return

    // Function to render math formulas using KaTeX, excluding code segments
    function renderMath(text: string): string {
      // Split text into code and non-code segments
      const segments = text.split(/(<code>[\s\S]*?<\/code>|```[\s\S]*?```)/)
      return segments
        .map((segment) => {
          // Process only non-code segments
          if (!segment.startsWith('<code>') && !segment.startsWith('```')) {
            return segment.replace(
              /(\$\$(.*?)\$\$|\$(.*?)\$|\\\((.*?)\\\))/g,
              (match, p1, p2, p3, p4) => {
                try {
                  // Choose the non-undefined group
                  const formula = p2 || p3 || p4
                  const result = katex.renderToString(formula, {
                    throwOnError: true // Avoid throwing errors
                  })
                  console.log(
                    `result: ${result} match: ${match} formula: ${formula}`
                  )
                  return result.includes('katex-error') ? match : result // Check if result contains 'katex-error' class, return original match if true
                } catch (e) {
                  // console.error('KaTeX rendering error:', e, match);
                  return match // Return the original string if there's an error
                }
              }
            )
          } else {
            return segment // Return code segments unchanged
          }
        })
        .join('') // Rejoin processed segments
    }

    // Then render math formulas within the converted HTML
    // const parsedMath = renderMath(text!)
    // console.log('parsedMath:', parsedMath)

    // Convert markdown to HTML first (assuming getPreviewHtml does this)
    const parsedMarkdown = await getPreviewHtml(text!)
    console.log('parsedMarkdown:', parsedMarkdown)

    return `<div>${highlightPreCode(parsedMarkdown)}</div>`
  }, [text])

  const [parsed, setParsed] = useState<string | undefined>()

  useEffect(() => {
    const processText = async () => {
      const trimmedText = text?.trim()
      if (!trimmedText) {
        setParsed(undefined)
        return
      }

      const parsedMarkdown = await getPreviewHtml(trimmedText)
      const highlightedHtml = highlightPreCode(parsedMarkdown)
      setParsed(`<div>${highlightedHtml}</div>`)
    }

    processText()
  }, [text])
  return (
    <div class="preview form-control message-text" tabIndex={0} {...props}>
      {parsed ? (
        <div dangerouslySetInnerHTML={{ __html: parsed }} />
      ) : (
        <span class="text-muted">{placeholder}</span>
      )}
    </div>
  )
}

export default ChatBoxPreview
