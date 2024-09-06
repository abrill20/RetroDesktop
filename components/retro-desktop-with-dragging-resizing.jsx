'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Folder, FileText, Settings, HelpCircle, X } from 'lucide-react'

const DesktopIcon = ({ icon: Icon, label, onClick }) => (
  <div className="flex flex-col items-center mb-4 cursor-pointer" onClick={onClick}>
    <div className="bg-white bg-opacity-20 p-2 rounded">
      <Icon className="w-8 h-8 text-white" />
    </div>
    <span className="text-white text-xs mt-1">{label}</span>
  </div>
)

const StartMenu = ({ isOpen, onClose }) => {
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

const Window = ({ id, title, content, onClose, position, size, onMouseDown, onResize }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    onMouseDown()
  }

  const handleResizeMouseDown = (e) => {
    e.stopPropagation()
    setIsResizing(true)
    onMouseDown()
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y
        onResize(id, { x: newX, y: newY }, size)
      } else if (isResizing) {
        const newWidth = Math.max(200, e.clientX - position.x)
        const newHeight = Math.max(100, e.clientY - position.y)
        onResize(id, position, { width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
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
        onMouseDown={handleMouseDown}
      >
        <span className="text-white text-sm">{title}</span>
        <button onClick={onClose} className="text-white focus:outline-none">
          <X size={16} />
        </button>
      </div>
      <div className="p-4 text-white text-sm h-[calc(100%-28px)] overflow-auto">{content}</div>
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  )
}

export function RetroDesktopWithDraggingResizing() {
  const [time, setTime] = useState(new Date())
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
  const [windows, setWindows] = useState([])
  const [activeWindow, setActiveWindow] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const openWindow = (title, content) => {
    const newWindow = {
      id: Date.now(),
      title,
      content,
      position: { x: 50 + Math.random() * 100, y: 50 + Math.random() * 100 },
      size: { width: 300, height: 200 },
      zIndex: windows.length
    }
    setWindows([...windows, newWindow])
    setActiveWindow(newWindow.id)
  }

  const closeWindow = (id) => {
    setWindows(windows.filter(w => w.id !== id))
    if (activeWindow === id) {
      setActiveWindow(null)
    }
  }

  const handleWindowMouseDown = useCallback((id) => {
    setActiveWindow(id)
    setWindows(windows => 
      windows.map(w => 
        w.id === id 
          ? { ...w, zIndex: Math.max(...windows.map(w => w.zIndex)) + 1 } 
          : w
      )
    )
  }, [])

  const handleWindowResize = useCallback((id, newPosition, newSize) => {
    setWindows(windows => 
      windows.map(w => 
        w.id === id 
          ? { ...w, position: newPosition, size: newSize } 
          : w
      )
    )
  }, [])

  return (
    <div className="h-screen w-full bg-cover bg-center relative overflow-hidden font-mono"
         style={{ backgroundImage: "url('/retro.jpeg?height=1080&width=1920')" }}>
      <div className="absolute inset-0 bg-black bg-opacity-30">
        <div className="p-4 grid grid-cols-4 gap-4">
          <DesktopIcon icon={Folder} label="My Documents" onClick={() => openWindow("My Documents", "This is the My Documents folder.")} />
          <DesktopIcon icon={FileText} label="README.txt" onClick={() => openWindow("README.txt", "Welcome to RetroOS!")} />
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
          style={{ zIndex: window.zIndex }}
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