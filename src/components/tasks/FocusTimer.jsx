import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  X, 
  Timer,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

export default function FocusTimer({ task, isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useTheme();
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(task?.estimated_time || 25);
  const [totalTime, setTotalTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize timer when task changes
  useEffect(() => {
    if (task && isOpen) {
      const initialMinutes = task.estimated_time || 25;
      setCustomMinutes(initialMinutes);
      const initialSeconds = initialMinutes * 60;
      setTimeLeft(initialSeconds);
      setTotalTime(initialSeconds);
      setIsCompleted(false);
      setIsRunning(false);
    }
  }, [task, isOpen]);

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            // Play completion sound
            if (audioRef.current) {
              audioRef.current.play().catch(console.error);
            }
            // Show browser notification
            if (Notification.permission === 'granted') {
              new Notification(`${t('focus.taskCompleted')}`, {
                body: task?.title || t('focus.focusSessionComplete'),
                icon: '/favicon.ico'
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, task, t]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const handleStart = () => {
    setIsRunning(true);
    setIsCompleted(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
    setIsCompleted(false);
  };

  const handleTimeChange = () => {
    const newSeconds = customMinutes * 60;
    setTimeLeft(newSeconds);
    setTotalTime(newSeconds);
    setIsRunning(false);
    setIsCompleted(false);
    setShowSettings(false);
  };

  const handleClose = () => {
    setIsRunning(false);
    setIsCompleted(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onClose();
  };

  if (!task) return null;

  return (
    <>
      {/* Hidden audio element for completion sound */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent 
          className={`sm:max-w-md ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700 text-gray-100' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}
          style={{ 
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            transform: 'none',
            margin: 0
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                {t('focus.focusTimer')}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Task Details */}
            <Card className={`${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {t('focus.currentTask')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                {task.description && (
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{task.estimated_time || 25} {t('focus.minutes')}</span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    task.priority === 'high' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {t(`form.priority.${task.priority}`) || task.priority}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timer Settings */}
            {showSettings && (
              <Card className={`${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('focus.timerSettings')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="timer-minutes" className="text-sm">
                        {t('focus.focusTime')} ({t('focus.minutes')})
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="timer-minutes"
                          type="number"
                          min="1"
                          max="120"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 25)}
                          className="w-20"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTimeChange}
                          className="text-xs"
                        >
                          {t('focus.update')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timer Display */}
            <div className="text-center space-y-4">
              {/* Circular Progress */}
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={
                      isCompleted 
                        ? '#10b981' 
                        : isRunning 
                          ? '#3b82f6' 
                          : '#6b7280'
                    }
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(progress)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              {isCompleted && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">{t('focus.completed')}</span>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex justify-center gap-3">
                {!isRunning ? (
                  <Button
                    onClick={handleStart}
                    disabled={timeLeft === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isCompleted ? t('focus.restart') : t('focus.start')}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    {t('focus.pause')}
                  </Button>
                )}
                
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-gray-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('focus.reset')}
                </Button>
              </div>
            </div>

            {/* Focus Tips */}
            <Card className={`${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-800' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{t('focus.focusTips')}</h4>
                    <ul className={`text-xs space-y-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <li>• {t('focus.tip1')}</li>
                      <li>• {t('focus.tip2')}</li>
                      <li>• {t('focus.tip3')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}