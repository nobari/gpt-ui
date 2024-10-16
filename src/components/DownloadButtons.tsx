import { useMemo } from 'preact/hooks'
import { useChatBox } from '../contexts/ChatBoxContext'
import { DOWNLOAD_TYPES, downloadWrapper } from '../utils/export'

export function DownloadButtons() {
  const { chatBoxs } = useChatBox()
  const downloadTypes = useMemo(() => {
    return (
      <ul class="dropdown-menu">
        {(['md', 'html', 'py'] as DOWNLOAD_TYPES[]).map((type) => (
          <li>
            <button
              type="button"
              class="dropdown-item"
              onClick={(e) => downloadWrapper(chatBoxs, type)}
            >
              {type == 'md' ? 'Markdown' : type == 'html' ? 'HTML' : 'Python'}
            </button>
          </li>
        ))}
      </ul>
    )
  }, [chatBoxs])
  return (
    <div class="btn-group" role="group">
      <button
        type="button"
        class="btn btn-sm btn-dark dropdown-toggle"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <span className="fas fa-download"></span> Download
      </button>
      {downloadTypes}
    </div>
  )
}
