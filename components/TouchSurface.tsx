import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AppSettings, TuioCursor, OSCMessage } from '../types';
import * as TuioService from '../services/tuioService';

interface TouchSurfaceProps {
  settings: AppSettings;
  socket: WebSocket | null;
  onExit: () => void;
  onLogout: () => void;
}

interface VisualCursor {
  id: number;
  x: number; // screen px
  y: number; // screen px
}

const TouchSurface: React.FC<TouchSurfaceProps> = ({ settings, socket, onExit, onLogout }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorsRef = useRef<Map<string, TuioCursor>>(new Map());
  const [visualCursors, setVisualCursors] = useState<VisualCursor[]>([]);
  const frameIdRef = useRef<number>(0);
  const mouseIdRef = useRef<string | null>(null);
  const lastMouseMoveTimeRef = useRef<number>(0);

  // Helper to send data
  const sendBundle = useCallback((messages: OSCMessage[]) => {
    // In offline mode (socket is null), we still process logic to update visuals, 
    // but obviously cannot send network data.
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = TuioService.generatePacket(messages, settings);
      socket.send(payload);
    }
  }, [socket, settings]);

  // 用于节流周期性更新的时间戳
  const lastPeriodicUpdateRef = useRef<number>(0);
  const PERIODIC_UPDATE_INTERVAL = 33; // 约30fps (33ms)

  // Main loop for periodic updates (if enabled) or just visual syncing
  const loop = useCallback(() => {
    setVisualCursors(Array.from(cursorsRef.current.values()).map((c: TuioCursor) => ({
      id: c.sessionId,
      x: c.x * window.innerWidth,
      y: c.y * window.innerHeight
    })));

    // 如果启用周期性更新，定期发送TUIO消息（作为备用，确保连接活跃）
    // 但主要更新应该由事件驱动（mousemove/touchmove）
    if (settings.periodicUpdates && cursorsRef.current.size > 0) {
      const now = performance.now();
      if (now - lastPeriodicUpdateRef.current >= PERIODIC_UPDATE_INTERVAL) {
        const messages: OSCMessage[] = [];
        messages.push(TuioService.createSourceMessage());
        
      // 发送所有活动cursor的set消息
      cursorsRef.current.forEach((cursor) => {
        messages.push(TuioService.createSetMessage(cursor, settings.coordinateScale));
      });
        
        const activeSessionIds = Array.from(cursorsRef.current.values()).map((c: TuioCursor) => c.sessionId);
        messages.push(TuioService.createAliveMessage(activeSessionIds));
        messages.push(TuioService.createFseqMessage());
        
        sendBundle(messages);
        lastPeriodicUpdateRef.current = now;
      }
    }

    frameIdRef.current = requestAnimationFrame(loop);
  }, [settings.periodicUpdates, sendBundle]);

  useEffect(() => {
    frameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [loop]);


  // Event Handlers
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // --- TOUCH HANDLING ---
    const processTouch = (e: TouchEvent, type: 'start' | 'move' | 'end' | 'cancel') => {
      e.preventDefault(); // STOP SCROLLING/ZOOMING
      
      const rect = element.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      const changedTouches = Array.from(e.changedTouches);
      const currentCursors = cursorsRef.current;
      const messages: OSCMessage[] = [];

      messages.push(TuioService.createSourceMessage());

      // 首先更新所有改变的cursor
      changedTouches.forEach(touch => {
        const idStr = touch.identifier.toString();
        let normX = (touch.clientX - rect.left) / width;
        let normY = (touch.clientY - rect.top) / height;
        
        // 确保坐标在有效范围内 (0-1)
        normX = Math.max(0, Math.min(1, normX));
        normY = Math.max(0, Math.min(1, normY));
        
        // 如果启用Y轴反转
        if (settings.invertY) {
          normY = 1 - normY;
        }

        if (type === 'start') {
          const newCursor = TuioService.createNewCursor(normX, normY);
          currentCursors.set(idStr, newCursor);
        } else if (type === 'move') {
          const existing = currentCursors.get(idStr);
          if (existing) {
            const updated = TuioService.updateCursorPhysics(existing, normX, normY);
            currentCursors.set(idStr, updated);
          }
        } else if (type === 'end' || type === 'cancel') {
          currentCursors.delete(idStr);
        }
      });

      // 根据TUIO标准，Bundle中应该包含所有活动cursor的set消息
      currentCursors.forEach((cursor) => {
        messages.push(TuioService.createSetMessage(cursor, settings.coordinateScale));
      });

      const activeSessionIds = Array.from(currentCursors.values()).map((c: TuioCursor) => c.sessionId);
      messages.push(TuioService.createAliveMessage(activeSessionIds));
      messages.push(TuioService.createFseqMessage());

      sendBundle(messages);
    };

    // --- MOUSE HANDLING (For Offline Demo / Desktop Testing) ---
    const handleMouseDown = (e: MouseEvent) => {
      // Only handle left click
      if (e.button !== 0) return;
      e.preventDefault();

      const rect = element.getBoundingClientRect();
      let normX = (e.clientX - rect.left) / rect.width;
      let normY = (e.clientY - rect.top) / rect.height;
      
      // 确保坐标在有效范围内 (0-1)
      normX = Math.max(0, Math.min(1, normX));
      normY = Math.max(0, Math.min(1, normY));
      
      // 如果启用Y轴反转
      if (settings.invertY) {
        normY = 1 - normY;
      }
      
      const idStr = 'mouse-0';
      mouseIdRef.current = idStr;

      const currentCursors = cursorsRef.current;
      const newCursor = TuioService.createNewCursor(normX, normY);
      currentCursors.set(idStr, newCursor);

      const messages: OSCMessage[] = [];
      messages.push(TuioService.createSourceMessage());
      
        // 发送所有活动cursor的set消息
        currentCursors.forEach((cursor) => {
          messages.push(TuioService.createSetMessage(cursor, settings.coordinateScale));
        });
      
      const activeSessionIds = Array.from(currentCursors.values()).map((c: TuioCursor) => c.sessionId);
      messages.push(TuioService.createAliveMessage(activeSessionIds));
      messages.push(TuioService.createFseqMessage());

      sendBundle(messages);
    };

    const MOUSE_MOVE_THROTTLE = 16; // 约60fps (16ms)

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseIdRef.current) return;
      e.preventDefault();

      // 节流处理，避免发送过于频繁
      const now = performance.now();
      if (now - lastMouseMoveTimeRef.current < MOUSE_MOVE_THROTTLE) {
        return;
      }
      lastMouseMoveTimeRef.current = now;

      const rect = element.getBoundingClientRect();
      let normX = (e.clientX - rect.left) / rect.width;
      let normY = (e.clientY - rect.top) / rect.height;
      
      // 确保坐标在有效范围内 (0-1)
      normX = Math.max(0, Math.min(1, normX));
      normY = Math.max(0, Math.min(1, normY));
      
      // 如果启用Y轴反转
      if (settings.invertY) {
        normY = 1 - normY;
      }
      
      const idStr = mouseIdRef.current;
      
      const currentCursors = cursorsRef.current;
      const existing = currentCursors.get(idStr);

      if (existing) {
        const updated = TuioService.updateCursorPhysics(existing, normX, normY);
        currentCursors.set(idStr, updated);

        // 立即发送更新，不等待周期性更新
        const messages: OSCMessage[] = [];
        messages.push(TuioService.createSourceMessage());
        
        // 发送所有活动cursor的set消息
        currentCursors.forEach((cursor) => {
          messages.push(TuioService.createSetMessage(cursor, settings.coordinateScale));
        });
        
        const activeSessionIds = Array.from(currentCursors.values()).map((c: TuioCursor) => c.sessionId);
        messages.push(TuioService.createAliveMessage(activeSessionIds));
        messages.push(TuioService.createFseqMessage());

        sendBundle(messages);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!mouseIdRef.current) return;
      e.preventDefault();
      
      const idStr = mouseIdRef.current;
      const currentCursors = cursorsRef.current;
      currentCursors.delete(idStr);
      mouseIdRef.current = null;

      const messages: OSCMessage[] = [];
      messages.push(TuioService.createSourceMessage());
      // 发送所有剩余活动cursor的set消息
      currentCursors.forEach((cursor) => {
        messages.push(TuioService.createSetMessage(cursor));
      });
      const activeSessionIds = Array.from(currentCursors.values()).map((c: TuioCursor) => c.sessionId);
      messages.push(TuioService.createAliveMessage(activeSessionIds));
      messages.push(TuioService.createFseqMessage());

      sendBundle(messages);
    };

    const handleTouchStart = (e: TouchEvent) => processTouch(e, 'start');
    const handleTouchMove = (e: TouchEvent) => processTouch(e, 'move');
    const handleTouchEnd = (e: TouchEvent) => processTouch(e, 'end');
    const handleTouchCancel = (e: TouchEvent) => processTouch(e, 'cancel');

    // Attach listeners
    // Touch (on container)
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    // Mouse (Mouse down on container, move/up on window to catch drags outside)
    element.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);

      element.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [settings, sendBundle]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(console.error);
    } else {
        document.exitFullscreen().catch(console.error);
    }
  };

  return (
    <div 
      ref={containerRef}
      // Removed 'cursor-none' so mouse arrow is visible for testing/demo
      className="relative w-full h-screen bg-slate-950 overflow-hidden touch-none select-none"
    >
      {/* Background Grid for Reference */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full" style={{ 
          backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}></div>
      </div>

      {/* Connection Status Indicator (Top Right) */}
      <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={onLogout}
            className="bg-slate-800/50 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-1 rounded-lg text-xs backdrop-blur transition mr-2"
          >
            ← 返回登录
          </button>
          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700 backdrop-blur text-xs pointer-events-none">
            <span className={`w-2 h-2 rounded-full ${socket?.readyState === WebSocket.OPEN ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="text-slate-300 font-mono">
              {socket ? `${settings.host}:${settings.port}` : 'OFFLINE MODE'}
            </span>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 pointer-events-none">TUIO 1.1 | {visualCursors.length} OBJ</div>
      </div>

      {/* Control Overlay (Bottom Left - pointer events allowed) */}
      <div className="absolute bottom-6 left-6 flex space-x-4 pointer-events-auto z-50">
        <button 
          onClick={onExit}
          className="bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700 px-4 py-2 rounded-lg text-sm backdrop-blur transition"
        >
          Exit
        </button>
        <button 
          onClick={toggleFullscreen}
          className="bg-slate-800/50 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2 rounded-lg text-sm backdrop-blur transition"
        >
           Fullscreen
        </button>
      </div>

      {/* Visual Cursors */}
      {visualCursors.map((c) => (
        <div
          key={c.id}
          style={{
            transform: `translate(${c.x - 32}px, ${c.y - 32}px)`,
          }}
          className="absolute w-16 h-16 pointer-events-none"
        >
          {/* Outer Ring */}
          <div className="absolute inset-0 border-2 border-tuio-400 rounded-full animate-ping opacity-50"></div>
          {/* Inner Circle */}
          <div className="absolute inset-2 border-2 border-white bg-tuio-500/30 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center justify-center">
            <span className="text-[10px] font-mono text-white drop-shadow-md">{c.id}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TouchSurface;