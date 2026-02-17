import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Safely attempt to get the environment variable
let envClientId = undefined;
try {
  // Use optional chaining for safety and cast to any to satisfy TS if types aren't perfect
  // This prevents crash if import.meta.env is undefined
  envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
} catch (e) {
  console.warn("Environment variables not accessible:", e);
}

// Use the environment variable if available, otherwise use the hardcoded fallback
const GOOGLE_CLIENT_ID = envClientId || "222612925549-3kjshsapngiopj12220s7q6dvct984md.apps.googleusercontent.com";

const root = ReactDOM.createRoot(rootElement);

if (!GOOGLE_CLIENT_ID) {
    // Render a simple error screen instead of crashing
    root.render(
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            color: '#ef4444', 
            flexDirection: 'column', 
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#0f172a'
        }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Configuration Error</h1>
            <p>Missing Client ID. Please configure VITE_GOOGLE_CLIENT_ID.</p>
        </div>
    );
} else {
    root.render(
      <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </React.StrictMode>
    );
}