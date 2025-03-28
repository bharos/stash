import React from 'react'

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <button className="absolute top-4 right-4 text-gray-500" onClick={onClose}>×</button>
        <div>{children}</div>
      </div>
    </div>
  )
}

export default Modal
