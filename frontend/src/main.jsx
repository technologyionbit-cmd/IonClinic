import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import UserTokenProvider from './Context/UserToken.jsx'

createRoot(document.getElementById('root')).render(

 
  <StrictMode>
      <UserTokenProvider>
    <App />
     </UserTokenProvider>
  </StrictMode>,
)
