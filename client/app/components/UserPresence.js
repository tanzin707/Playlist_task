'use client';

import { memo, useState } from 'react';

// Avatar component for displaying user initials - YouTube Music style
function UserAvatar({ name, avatar, isActive = true }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const avatarColor = avatar || 'from-red-600 to-red-700';

  return (
    <div
      className={`relative w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xs font-semibold shadow-md transition-all duration-300 hover:scale-110 ${
        isActive ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-[#0f0f0f]' : 'opacity-60'
      }`}
      title={name}
    >
      <span>{initials}</span>
      {isActive && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f0f] animate-pulse"></span>
      )}
    </div>
  );
}

function UserPresence({ users = [], currentUserId, onSetName }) {
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');

  if (users.length === 0) {
    return null;
  }

  const currentUser = users.find((u) => u.id === currentUserId);

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 -space-x-2">
          {users.slice(0, 3).map((user) => (
            <UserAvatar
              key={user.id}
              name={user.name}
              avatar={user.avatar}
              isActive={true}
            />
          ))}
          {users.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-[#272727] border-2 border-[#0f0f0f] flex items-center justify-center text-white text-xs font-semibold">
              +{users.length - 3}
            </div>
          )}
        </div>
        <div className="text-xs text-[#aaaaaa]">
          {users.length} {users.length === 1 ? 'user' : 'users'} online
        </div>
        {currentUser && (
          <button
            onClick={() => setShowNameModal(true)}
            className="ml-2 p-1.5 text-[#aaaaaa] hover:text-white hover:bg-[#272727] rounded-full transition-colors"
            title="Change your name"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {/* Name Change Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#030303] rounded-xl shadow-2xl border border-[#272727] p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Change Your Name</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={currentUser?.name || 'Your name'}
              maxLength={20}
              className="w-full px-4 py-2 mb-4 bg-[#272727] text-white border border-[#3d3d3d] rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
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
                className="px-4 py-2 bg-[#272727] hover:bg-[#3d3d3d] text-[#f1f1f1] rounded-full font-medium transition-colors"
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
                className="px-4 py-2 bg-white hover:bg-[#f1f1f1] text-black rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
