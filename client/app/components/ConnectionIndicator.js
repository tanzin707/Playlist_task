import { memo } from 'react';

function ConnectionIndicator({ connected, reconnecting }) {
  const getStatus = () => {
    if (connected) return { text: 'Connected', colorClass: 'bg-green-400', shadowClass: 'shadow-green-400/50', pulse: true };
    if (reconnecting) return { text: 'Reconnecting...', colorClass: 'bg-yellow-400', shadowClass: 'shadow-yellow-400/50', pulse: true };
    return { text: 'Disconnected', colorClass: 'bg-red-400', shadowClass: 'shadow-red-400/50', pulse: true };
  };

  const status = getStatus();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gray-800/50 border border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg">
      <div
        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
          status.pulse
            ? `${status.colorClass} animate-pulse ${status.shadowClass} shadow-lg scale-110`
            : status.colorClass
        }`}
      />
      <span className="text-xs sm:text-sm text-gray-300 font-medium transition-colors duration-300 hidden sm:inline">
        {status.text}
      </span>
    </div>
  );
}

export default memo(ConnectionIndicator);

