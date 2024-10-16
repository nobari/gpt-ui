import { ComponentChildren } from 'preact'

interface AccordionProps {
  title: string
  children: ComponentChildren
  id: string
}

export function Accordion({ title, children, id }: AccordionProps) {
  return (
    <div className="accordion" id={`${id}Accordion`}>
      <div className="accordion-item">
        <h2 className="accordion-header">
          <button 
            className="accordion-button collapsed" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target={`#${id}Content`} 
            aria-expanded="false" 
            aria-controls={`${id}Content`}
          >
            {title}
          </button>
        </h2>
        <div 
          id={`${id}Content`} 
          className="accordion-collapse collapse" 
          data-bs-parent={`#${id}Accordion`}
        >
          <div className="accordion-body">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
