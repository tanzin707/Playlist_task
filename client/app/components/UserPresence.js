'use client';

import { memo, useState, useEffect } from 'react';

// Avatar component for displaying user initials
function UserAvatar({ name, avatar, isActive = true }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div
      className={`relative w-8 h-8 rounded-full bg-gradient-to-br ${avatar} flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all duration-300 hover:scale-110 ${
        isActive ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-gray-900' : 'opacity-60'
      }`}
      title={name}
    >
      <span>{initials}</span>
      {isActive && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></span>
      )}
    </div>
  );
}

function UserPresence({ users = [], currentUserId, onSetName }) {
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const currentUser = users.find((u) => u.id === currentUserId);

  if (users.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl p-3 sm:p-4 border border-gray-700/50 animate-fade-in relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-300 flex items-center gap-1.5 sm:gap-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Active Users ({users.length})
            </h3>
            {currentUser && (
              <button
                onClick={() => setShowNameModal(true)}
                className="text-xs text-gray-400 hover:text-purple-400 transition-colors duration-200 p-1 hover:bg-gray-800/50 rounded"
                title="Change your name"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
            >
              <UserAvatar name={user.name} avatar={user.avatar} isActive={true} />
              <span className="text-xs text-gray-300 font-medium truncate max-w-[80px]">
                {user.id === currentUserId ? 'You' : user.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Name Change Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-4">Change Your Name</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={currentUser?.name || 'Your name'}
              maxLength={20}
              className="w-full px-4 py-2 mb-4 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  onSetName(newName.trim());
                  setShowNameModal(false);
                  setNewName('');
                } else if (e.key === 'Escape') {
                  setShowNameModal(false);
                  setNewName('');
                }
              }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNameModal(false);
                  setNewName('');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newName.trim()) {
                    onSetName(newName.trim());
                    setShowNameModal(false);
                    setNewName('');
                  }
                }}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(UserPresence);
