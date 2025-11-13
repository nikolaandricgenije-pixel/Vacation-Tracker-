import React, { useState, useEffect } from 'react';
import { useVacationState } from '../context/VacationContext';

interface DiscordStatusData {
  isDiscordLinked: boolean;
  discordUsername: string | null;
  user: {
    name: string;
    email: string;
  };
}

const DiscordStatus: React.FC = () => {
  const { currentUser } = useVacationState();
  const [status, setStatus] = useState<DiscordStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDiscordStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/discord/status?email=${encodeURIComponent(currentUser.email)}`);
      const data = await response.json();

      if (response.ok) {
        setStatus(data);
      } else {
        setError(data.error || 'Failed to check Discord status');
      }
    } catch (err) {
      setError('Network error while checking Discord status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDiscordStatus();
  }, [currentUser.email]);

  const handleLoginWithDiscord = () => {
    window.location.href = '/api/auth?action=discord';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-slate-600 dark:text-slate-400">Checking Discord status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
        <span className="text-sm text-red-600 dark:text-red-400">Error: {error}</span>
        <button
          onClick={checkDiscordStatus}
          className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {status.isDiscordLinked ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Discord Linked
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          <span className="text-sm text-amber-700 dark:text-amber-400">
            Discord Not Linked
          </span>
          <button
            onClick={handleLoginWithDiscord}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Link Discord
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscordStatus;