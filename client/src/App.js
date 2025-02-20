import React from 'react';
import Terminal from './components/Terminal.jsx';
import '@fontsource/source-code-pro';
import '@fontsource/source-code-pro';
import { AuthProvider } from './components/AuthProvider'

function App() {
    return (
        <AuthProvider>
            <Terminal />
        </AuthProvider>
    )
}

export default App
