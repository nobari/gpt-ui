import { render } from 'preact'
import { App } from './app.tsx'
import './index.scss'
import { BrowserRouter as Router } from 'react-router-dom';

render(<Router><App /></Router>, document.getElementById('app')!)
