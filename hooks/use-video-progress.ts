import { useState, useEffect, useCallback } from 'react';
import { VideoProgress, VideoProgressTracker } from '@/lib/video-progress-tracker';

interface UseVideoProgressOptions {
  autoStart?: boolean;
  pollingInterval?: number;
  onComplete?: (videoUrl: string) => void;
  onError?: (error: string) => void;
}

export function useVideoProgress(
  videoId: string | null,
  options: UseVideoProgressOptions = {}
) {
  const { 
    autoStart = true, 
    pollingInterval = 3000,
    onComplete,
    onError
  } = options;
  
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPolling = useCallback(() => {
    if (!videoId) return;
    
    const apiKey = process.env.NEXT_PUBLIC_REPLICATE_API_KEY || process.env.REPLICATE_API_KEY;
    if (!apiKey) {
      setError('Replicate API key not configured');
      return;
    }

    setIsPolling(true);
    setError(null);
    
    const tracker = VideoProgressTracker.getInstance();
    tracker.startPolling(
      videoId,
      apiKey,
      (progressData) => {
        setProgress(progressData);
        
        // Handle completion
        if (progressData.status === 'succeeded') {
          onComplete?.(progressData.id);
        } else if (progressData.status === 'failed') {
          const errorMsg = progressData.error || 'Video generation failed';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      },
      pollingInterval
    );
  }, [videoId, pollingInterval, onComplete, onError]);

  const stopPolling = useCallback(() => {
    if (!videoId) return;
    
    const tracker = VideoProgressTracker.getInstance();
    tracker.stopPolling(videoId);
    setIsPolling(false);
  }, [videoId]);

  // Auto-start polling
  useEffect(() => {
    if (autoStart && videoId) {
      startPolling();
    }
    
    return () => {
      if (videoId) {
        stopPolling();
      }
    };
  }, [videoId, autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format helpers
  const formatTime = useCallback((seconds: number) => {
    return VideoProgressTracker.formatTimeRemaining(seconds);
  }, []);

  const formatElapsed = useCallback(() => {
    if (!progress?.startedAt) return '0:00';
    return VideoProgressTracker.formatElapsedTime(progress.startedAt);
  }, [progress]);

  return {
    progress,
    error,
    isPolling,
    startPolling,
    stopPolling,
    formatTime,
    formatElapsed
  };
}