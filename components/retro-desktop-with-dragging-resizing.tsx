'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Folder, FileText, Settings, HelpCircle, X, Power } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface DesktopIconProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ icon: Icon, label, onClick }) => (
  <div className="flex flex-col items-center mb-4 cursor-pointer" onClick={onClick}>
    <div className="bg-white bg-opacity-20 p-2 rounded">
      <Icon className="w-8 h-8 text-white" />
    </div>
    <span className="text-white text-xs mt-1">{label}</span>
  </div>
)

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  
  return (
    <div className="absolute bottom-10 left-0 w-48 bg-gray-800 border border-gray-700 rounded-t-lg shadow-lg">
      <div className="p-2 hover:bg-gray-700 cursor-pointer">Programs</div>
      <div className="p-2 hover:bg-gray-700 cursor-pointer">Documents</div>
      <div className="p-2 hover:bg-gray-700 cursor-pointer">Settings</div>
      <div className="p-2 hover:bg-gray-700 cursor-pointer" onClick={onClose}>Shut Down</div>
    </div>
  )
}

interface WindowProps {
  id: number;
  title: string;
  content: string;
  onClose: () => void;
  position: { x: number; y: number };
  size: { width: number; height: number };
  onMouseDown: () => void;
  onResize: (id: number, newPosition: { x: number; y: number }, newSize: { width: number; height: number }) => void;
  onContentChange?: (newContent: string) => void;
  isEditable?: boolean;
}

const Window: React.FC<WindowProps> = ({ 
  id, title, content, onClose, position, size, onMouseDown, onResize, onContentChange, isEditable 
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    setIsDragging(true)
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y
    })
    onMouseDown()
  }

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    onMouseDown()
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      if (isDragging) {
        const newX = clientX - dragOffset.x
        const newY = clientY - dragOffset.y
        onResize(id, { x: newX, y: newY }, size)
      } else if (isResizing) {
        const newWidth = Math.max(200, clientX - position.x)
        const newHeight = Math.max(100, clientY - position.y)
        onResize(id, position, { width: newWidth, height: newHeight })
      }
    }

    const handleEnd = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('touchmove', handleMove)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchend', handleEnd)
    }

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, isResizing, dragOffset, id, onResize, position, size])

  return (
    <div 
      className="absolute bg-gray-800 border border-gray-600 rounded shadow-lg overflow-hidden"
      style={{ 
        width: `${size.width}px`, 
        height: `${size.height}px`, 
        left: `${position.x}px`, 
        top: `${position.y}px` 
      }}
    >
      <div 
        className="bg-gray-700 px-2 py-1 flex justify-between items-center cursor-move"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <span className="text-white text-sm">{title}</span>
        <button onClick={onClose} className="text-white focus:outline-none">
          <X size={16} />
        </button>
      </div>
      <div className="p-4 text-white text-sm h-[calc(100%-28px)] overflow-auto">
        {isEditable ? (
          <textarea
            className="w-full h-full bg-transparent text-white resize-none focus:outline-none"
            value={content}
            onChange={(e) => onContentChange && onContentChange(e.target.value)}
          />
        ) : (
          content
        )}
      </div>
      <div 
        className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize"
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
      />
    </div>
  )
}

interface WindowData {
  id: number;
  title: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isEditable: boolean;
}

const PowerButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black">
    <button
      onClick={onClick}
      className="text-green-500 hover:text-green-400 focus:outline-none transition-colors duration-300"
      aria-label="Power On"
    >
      <Power size={100} />
    </button>
  </div>
)

export default function RetroDesktop() {
  const [time, setTime] = useState(new Date())
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
  const [windows, setWindows] = useState<WindowData[]>([])
  const [activeWindow, setActiveWindow] = useState<number | null>(null)
  const [isPoweredOn, setIsPoweredOn] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const openWindow = (title: string, content: string, isEditable: boolean = false) => {
    const newWindow: WindowData = {
      id: Date.now(),
      title,
      content,
      position: { x: 50 + Math.random() * 100, y: 50 + Math.random() * 100 },
      size: { width: 300, height: 200 },
      zIndex: windows.length,
      isEditable
    }
    setWindows([...windows, newWindow])
    setActiveWindow(newWindow.id)
  }

  const closeWindow = (id: number) => {
    setWindows(windows.filter(w => w.id !== id))
    if (activeWindow === id) {
      setActiveWindow(null)
    }
  }

  const handleWindowMouseDown = useCallback((id: number) => {
    setActiveWindow(id)
    setWindows(windows => 
      windows.map(w => 
        w.id === id 
          ? { ...w, zIndex: Math.max(...windows.map(w => w.zIndex)) + 1 } 
          : w
      )
    )
  }, [])

  const handleWindowResize = useCallback((id: number, newPosition: { x: number; y: number }, newSize: { width: number; height: number }) => {
    setWindows(windows => 
      windows.map(w => 
        w.id === id 
          ? { ...w, position: newPosition, size: newSize } 
          : w
      )
    )
  }, [])

  const handleContentChange = useCallback((id: number, newContent: string) => {
    setWindows(windows =>
      windows.map(w =>
        w.id === id
          ? { ...w, content: newContent }
          : w
      )
    )
  }, [])

  if (!isPoweredOn) {
    return <PowerButton onClick={() => setIsPoweredOn(true)} />
  }

  return (
    <div 
      className="h-screen w-full bg-cover bg-center relative overflow-hidden font-mono"
      style={{ backgroundImage: "url('/retro.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-30">
        <div className="p-4 grid grid-cols-4 gap-4">
          <DesktopIcon icon={Folder} label="My Documents" onClick={() => openWindow("My Documents", "This is the My Documents folder.")} />
          <DesktopIcon icon={FileText} label="README.txt" onClick={() => openWindow("README.txt", "Welcome to RetroOS! Feel free to edit this file.", true)} />
          <DesktopIcon icon={Settings} label="Control Panel" onClick={() => openWindow("Control Panel", "System settings and configurations.")} />
          <DesktopIcon icon={HelpCircle} label="Help" onClick={() => openWindow("Help", "Need assistance? Click here for help.")} />
        </div>
      </div>
      
      {windows.map(window => (
        <Window
          key={window.id}
          id={window.id}
          title={window.title}
          content={window.content}
          onClose={() => closeWindow(window.id)}
          position={window.position}
          size={window.size}
          onMouseDown={() => handleWindowMouseDown(window.id)}
          onResize={handleWindowResize}
          onContentChange={(newContent) => handleContentChange(window.id, newContent)}
          isEditable={window.isEditable}
        />
      ))}
      
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-800 flex items-center px-2 text-white">
        <button 
          className="px-4 py-1 bg-gray-700 rounded mr-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
          onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
        >
          Start
        </button>
        <StartMenu isOpen={isStartMenuOpen} onClose={() => setIsStartMenuOpen(false)} />
        <div className="flex-grow" />
        <div className="text-sm">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}