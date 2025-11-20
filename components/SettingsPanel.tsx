import React from 'react';
import { AppSettings, Protocol } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onStart: () => void;
  onOffline: () => void;
  onLogout: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSave, onStart, onOffline, onLogout }) => {
  const handleChange = (field: keyof AppSettings, value: any) => {
    onSave({ ...settings, [field]: value });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-6 bg-tuio-900 text-tuio-100 relative">
      {/* 返回按钮 - 右上角 */}
      <button
        onClick={onLogout}
        className="absolute top-6 right-6 bg-slate-800/50 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2 rounded-lg text-sm backdrop-blur transition z-50"
      >
        ← 返回登录
      </button>
      
      <div className="w-full max-w-md bg-tuio-800 border border-slate-700 rounded-xl shadow-2xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">WebTUIO</h1>
          <p className="text-slate-400 text-sm">OSC/TUIO 1.1 Controller</p>
        </div>

        <div className="space-y-6">
          {/* Network Settings */}
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-tuio-500">Connection</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs mb-1 text-slate-400">Host IP (Bridge)</label>
                <input
                  type="text"
                  value={settings.host}
                  onChange={(e) => handleChange('host', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-tuio-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-400">Port</label>
                <input
                  type="number"
                  value={settings.port}
                  onChange={(e) => handleChange('port', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-tuio-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1 text-slate-400">Protocol Mode</label>
              <div className="flex bg-slate-900 p-1 rounded border border-slate-600">
                <button
                  onClick={() => handleChange('protocol', Protocol.UDP_BRIDGE)}
                  className={`flex-1 py-1.5 text-sm rounded transition ${
                    settings.protocol === Protocol.UDP_BRIDGE ? 'bg-tuio-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  UDP Bridge
                </button>
                <button
                  onClick={() => handleChange('protocol', Protocol.WEBSOCKET)}
                  className={`flex-1 py-1.5 text-sm rounded transition ${
                    settings.protocol === Protocol.WEBSOCKET ? 'bg-tuio-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WebSocket
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                *Use UDP Bridge if connecting to a ws2udp relay.
              </p>
            </div>
          </div>

          {/* TUIO Engine Settings */}
          <div className="space-y-4">
             <h2 className="text-xs uppercase tracking-widest font-semibold text-tuio-500">TUIO Engine</h2>
             
             <div className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded transition">
                <span className="text-sm">Periodic Updates</span>
                <button
                  onClick={() => handleChange('periodicUpdates', !settings.periodicUpdates)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${settings.periodicUpdates ? 'bg-tuio-500' : 'bg-slate-600'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.periodicUpdates ? 'left-6' : 'left-1'}`} />
                </button>
             </div>

             <div className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded transition">
                <span className="text-sm">Full Bundle</span>
                <button
                  onClick={() => handleChange('fullBundle', !settings.fullBundle)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${settings.fullBundle ? 'bg-tuio-500' : 'bg-slate-600'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.fullBundle ? 'left-6' : 'left-1'}`} />
                </button>
             </div>

             <div className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded transition">
                <span className="text-sm">Blob Messages</span>
                <button
                  onClick={() => handleChange('blobMessages', !settings.blobMessages)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${settings.blobMessages ? 'bg-tuio-500' : 'bg-slate-600'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.blobMessages ? 'left-6' : 'left-1'}`} />
                </button>
             </div>

             <div className="space-y-2">
                <label className="block text-xs mb-1 text-slate-400">Coordinate Scale</label>
                <input
                  type="number"
                  value={settings.coordinateScale}
                  onChange={(e) => handleChange('coordinateScale', parseFloat(e.target.value) || 1.0)}
                  min="0.1"
                  max="10000"
                  step="0.1"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-tuio-500 outline-none transition"
                />
                <p className="text-[10px] text-slate-500">
                  坐标缩放因子：1.0=归一化(0-1)，1920=像素宽度，1080=像素高度
                </p>
             </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={onStart}
              className="w-full bg-gradient-to-r from-tuio-500 to-blue-600 hover:from-tuio-400 hover:to-blue-500 text-white font-bold py-4 rounded-lg shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
            >
              INITIALIZE TUIO
            </button>

            <button
              onClick={onOffline}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors underline"
            >
              Enter Demo Mode (Offline)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;