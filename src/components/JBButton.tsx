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
    <>
      <input type="checkbox" id="jbCheck" onChange={handleChange} />
      <label htmlFor="jbCheck">JB</label>
    </>
  )
}

export default JBButton
