import React, { useState, useEffect, useCallback } from 'react';
import SettingsPanel from './components/SettingsPanel';
import TouchSurface from './components/TouchSurface';
import { AppSettings } from './types';
import { DEFAULT_SETTINGS, STORAGE_KEY } from './constants';

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save settings handler
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  // Start/Connect
  const handleStart = useCallback(() => {
    setErrorMsg(null);
    
    // Sanitize Host
    let host = settings.host.trim();
    // Remove existing protocol if user typed it to avoid double prefix
    host = host.replace(/^wss?:\/\//, '').replace(/^https?:\/\//, '');

    // Check environment for Mixed Content restrictions
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss://' : 'ws://';
    const url = `${protocol}${host}:${settings.port}`;

    console.log(`Attempting connection to ${url}`);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket Connected');
        setIsRunning(true);
      };

      ws.onerror = () => {
        // WebSocket Error Event is generic and contains no details for security reasons.
        console.error('WebSocket Connection Failed');
        
        let message = `Connection failed to ${url}.`;
        
        if (isHttps && protocol === 'wss://') {
           message += ` (HTTPS requires WSS. Ensure bridge supports SSL)`;
        } else if (isHttps && protocol === 'ws://') {
           message += ` (Mixed Content Blocked: Cannot connect to WS from HTTPS)`;
        } else {
           message += ` Ensure Bridge is running.`;
        }
        
        setErrorMsg(message);
        // Don't set socket state if it failed immediately
        setSocket(null);
      };

      ws.onclose = (e) => {
        console.log(`WebSocket Closed. Code: ${e.code}`);
        // Optionally handle disconnect state here if needed
      };

      setSocket(ws);
    } catch (err) {
      console.error("WebSocket Init Error:", err);
      setErrorMsg("Invalid Host/Port configuration.");
    }
  }, [settings]);

  // Offline/Demo Mode
  const handleOffline = useCallback(() => {
    setErrorMsg(null);
    setSocket(null);
    setIsRunning(true);
  }, []);

  // Stop/Disconnect
  const handleStop = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setIsRunning(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [socket]);

  return (
    <div className="w-full h-full text-sans bg-slate-950">
      {!isRunning ? (
        <>
          <SettingsPanel 
            settings={settings} 
            onSave={handleSaveSettings} 
            onStart={handleStart}
            onOffline={handleOffline}
          />
          {errorMsg && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md bg-red-500/90 text-white px-6 py-4 rounded-xl shadow-xl z-50 border border-red-400/50 backdrop-blur-sm flex items-center">
              <div className="mr-3 text-2xl">⚠️</div>
              <div className="flex-1 text-sm font-medium">{errorMsg}</div>
              <button 
                onClick={() => setErrorMsg(null)}
                className="ml-3 p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition"
              >
                ✕
              </button>
            </div>
          )}
        </>
      ) : (
        <TouchSurface 
          settings={settings} 
          socket={socket} 
          onExit={handleStop} 
        />
      )}
    </div>
  );
};

export default App;