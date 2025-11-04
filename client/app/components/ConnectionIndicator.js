import { memo } from 'react';

function ConnectionIndicator({ connected, reconnecting }) {
  const getStatus = () => {
    if (connected) return { text: 'Connected', colorClass: 'bg-green-400', shadowClass: 'shadow-green-400/50', pulse: true };
    if (reconnecting) return { text: 'Reconnecting...', colorClass: 'bg-yellow-400', shadowClass: 'shadow-yellow-400/50', pulse: true };
    return { text: 'Disconnected', colorClass: 'bg-red-400', shadowClass: 'shadow-red-400/50', pulse: true };
  };

  const status = getStatus();

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-full text-xs text-[#aaaaaa]">
      <div
        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          status.pulse
            ? `${status.colorClass} animate-pulse`
            : status.colorClass
        }`}
      />
      <span className="hidden sm:inline">
        {status.text}
      </span>
    </div>
  );
}

export default memo(ConnectionIndicator);

