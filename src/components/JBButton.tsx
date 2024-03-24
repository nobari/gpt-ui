import { ChangeEvent } from 'preact/compat'

interface JBButtonProps {
  onChange: (value: boolean) => void
}

const JBButton: React.FC<JBButtonProps> = ({ onChange }) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement
    onChange(target.checked)
  }

  return (
    <div className="form-check d-flex align-items-center">
      <input className="form-check-input" type="checkbox" id="jbCheck" onChange={handleChange} />
      <label className="form-check-label mx-2" htmlFor="jbCheck">
        JB
      </label>
    </div>
  )
}

export default JBButton
