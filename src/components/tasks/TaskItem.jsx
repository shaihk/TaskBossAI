import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause, 
  Clock,
  Calendar,
  Award,
  ArrowRight,
  Settings,
  Edit,
  Timer
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTheme } from "@/context/ThemeContext";

import TaskPlanningChat from "./TaskPlanningChat";
import TaskEditForm from "./TaskEditForm";
import FocusTimer from "./FocusTimer";

const statusIcons = {
  pending: Circle,
  in_progress: Play,
  completed: CheckCircle2,
  paused: Pause
};

const statusColors = {
  pending: "text-gray-400",
  in_progress: "text-blue-500",
  completed: "text-green-500",
  paused: "text-orange-500"
};

// Priority color schemes for light and dark modes - Traffic light system
const priorityColors = {
  low: {
    light: "border-l-4 border-l-green-400 bg-green-50 hover:bg-green-100",
    dark: "border-l-4 border-l-green-500 bg-green-900/20 hover:bg-green-900/30",
    white: "border-l-4 border-l-green-400 bg-white hover:bg-gray-50"
  },
  medium: {
    light: "border-l-4 border-l-green-600 bg-green-100 hover:bg-green-200",
    dark: "border-l-4 border-l-green-600 bg-green-800/30 hover:bg-green-800/40",
    white: "border-l-4 border-l-green-600 bg-white hover:bg-gray-50"
  },
  high: {
    light: "border-l-4 border-l-yellow-500 bg-yellow-50 hover:bg-yellow-100",
    dark: "border-l-4 border-l-yellow-500 bg-yellow-900/20 hover:bg-yellow-900/30",
    white: "border-l-4 border-l-yellow-500 bg-white hover:bg-gray-50"
  },
  urgent: {
    light: "border-l-4 border-l-red-500 bg-red-50 hover:bg-red-100 animate-pulse-subtle",
    dark: "border-l-4 border-l-red-500 bg-red-900/30 hover:bg-red-900/40 animate-pulse-subtle",
    white: "border-l-4 border-l-red-500 bg-white hover:bg-gray-50 animate-pulse-subtle"
  }
};

const priorityBadgeColors = {
  low: {
    light: "bg-green-100 text-green-800",
    dark: "bg-green-900/50 text-green-300"
  },
  medium: {
    light: "bg-yellow-100 text-yellow-800",
    dark: "bg-yellow-900/50 text-yellow-300"
  },
  high: {
    light: "bg-orange-100 text-orange-800",
    dark: "bg-orange-900/50 text-orange-300"
  },
  urgent: {
    light: "bg-red-100 text-red-800",
    dark: "bg-red-900/50 text-red-300"
  }
};

export default function TaskItem({ task, goal, onStatusChange, showGoalInfo = true, onCreateSubTask, onTaskUpdate }) {
  const { t, i18n } = useTranslation();
  const StatusIcon = statusIcons[task.status];
  const isCompleted = task.status === "completed";
  const isOverdue = (task.dueDate || task.due_date) && new Date(task.dueDate || task.due_date) < new Date() && !isCompleted;
  const priority = task.priority || 'medium';
  
  // Get user preference for white background
  const useWhiteBackground = localStorage.getItem('taskWhiteBackground') === 'true';

  // Text colors based on priority and theme
  const getTextColors = () => {
    if (isCompleted) {
      return {
        textColor: 'text-gray-500',
        secondaryTextColor: 'text-gray-400',
        linkColor: 'text-blue-600 hover:text-blue-800',
        dateColor: 'text-gray-400',
        overdueColor: 'text-red-600'
      };
    }
    
    // For urgent and high priority, use contrasting colors
    if (priority === 'urgent') {
      return isDarkMode ? {
        textColor: 'text-white',
        secondaryTextColor: 'text-gray-100',
        linkColor: 'text-white hover:text-gray-200 underline',
        dateColor: 'text-gray-100',
        overdueColor: 'text-yellow-300'
      } : {
        textColor: 'text-gray-900',
        secondaryTextColor: 'text-gray-700',
        linkColor: 'text-blue-700 hover:text-blue-900',
        dateColor: 'text-gray-700',
        overdueColor: 'text-red-800'
      };
    }
    
    if (priority === 'high') {
      return isDarkMode ? {
        textColor: 'text-white',
        secondaryTextColor: 'text-gray-100',
        linkColor: 'text-white hover:text-gray-200 underline',
        dateColor: 'text-gray-100',
        overdueColor: 'text-yellow-300'
      } : {
        textColor: 'text-gray-900',
        secondaryTextColor: 'text-gray-700',
        linkColor: 'text-blue-700 hover:text-blue-900',
        dateColor: 'text-gray-700',
        overdueColor: 'text-red-800'
      };
    }
    
    // For medium and low priority, use default colors
    return isDarkMode ? {
      textColor: 'text-gray-200',
      secondaryTextColor: 'text-gray-300',
      linkColor: 'text-blue-400 hover:text-blue-300',
      dateColor: 'text-gray-300',
      overdueColor: 'text-yellow-400'
    } : {
      textColor: 'text-gray-900',
      secondaryTextColor: 'text-gray-600',
      linkColor: 'text-blue-600 hover:text-blue-800',
      dateColor: 'text-gray-500',
      overdueColor: 'text-red-600'
    };
  };

  const [showPlanningChat, setShowPlanningChat] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const { isDarkMode } = useTheme();
  
  // Listen for storage changes to update UI preferences
  useEffect(() => {
    const handleStorageChange = () => {
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const { textColor, secondaryTextColor, linkColor, dateColor, overdueColor } = getTextColors();

  const getNextStatus = () => {
    switch (task.status) {
      case "pending": return "in_progress";
      case "in_progress": return "completed";
      case "completed": return "pending";
      case "paused": return "in_progress";
      default: return "completed";
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case "pending": return t('tasks.start');
      case "in_progress": return t('tasks.finish');
      case "completed": return t('tasks.cancel');
      case "paused": return t('tasks.continue');
      default: return t('tasks.update');
    }
  };

  const handleTaskUpdate = () => {
    setShowEditForm(false);
    if (onTaskUpdate) {
      onTaskUpdate();
    }
  };

  return (
    <>
      <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 ${
        isCompleted ? "bg-green-50 border-l-4 border-l-green-400" :
        priorityColors[priority]?.[useWhiteBackground ? 'white' : (isDarkMode ? 'dark' : 'light')] || 'bg-white border-l-4 border-l-gray-300'
      } mobile-task-card`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-4">
            {/* Status Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await onStatusChange(task, getNextStatus());
                } catch (error) {
                  console.error("Error changing task status:", error);
                  alert("שגיאה בעדכון סטטוס המשימה. אנא נסה שוב.");
                }
              }}
              className="p-1 hover:bg-transparent min-w-fit"
            >
              <StatusIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${statusColors[task.status]}`} />
            </Button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-semibold ${
                  isCompleted ? "line-through text-gray-500" : textColor
                }`}>
                  {task.title}
                </h3>
                {task.points_earned > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    +{task.points_earned}
                  </Badge>
                )}
              </div>

              {/* Task Description */}
              {task.description && (
                <p className={`text-sm mb-2 ${isCompleted ? 'text-gray-500' : secondaryTextColor}`}>{task.description}</p>
              )}

              {/* Goal Info */}
              {showGoalInfo && goal && (
                <div className="mb-2">
                  <Link to={createPageUrl(`Goals?goal=${goal.id}`)} className={`flex items-center gap-1 text-sm ${linkColor}`}>
                    <span>{t('tasks.goalLabel', { title: goal.title })}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Task Meta */}
              <div className="flex flex-wrap gap-2 mb-2">
                {/* Priority Badge */}
                <Badge className={priorityBadgeColors[priority][isDarkMode ? 'dark' : 'light']}>
                  {t(`form.priority.${priority}`)}
                </Badge>
                
                {/* Status Badge */}
                <Badge variant="outline" className={`${statusColors[task.status]} border-current`}>
                  {t(`form.status.${task.status === 'in_progress' ? 'inProgress' : task.status}`)}
                </Badge>
                
                {task.difficulty && (
                  <Badge variant="outline">
                    {t('tasks.difficulty', { level: task.difficulty })}
                  </Badge>
                )}
                {(task.estimatedTime || task.estimated_time) && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t('tasks.estimatedTime', { time: task.estimatedTime || task.estimated_time })}
                  </Badge>
                )}
              </div>

              {/* Due Date */}
              {(task.dueDate || task.due_date) && (
                <div className={`flex items-center gap-1 text-sm ${
                  isOverdue ? overdueColor : dateColor
                }`}>
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(task.dueDate || task.due_date), "d MMMM yyyy", { locale: i18n.language === 'he' ? he : undefined })}
                  </span>
                  {isOverdue && <span className="font-medium">{t('tasks.overdue')}</span>}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-1 sm:gap-2 mobile-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await onStatusChange(task, getNextStatus());
                  } catch (error) {
                    console.error("Error changing task status:", error);
                    alert("שגיאה בעדכון סטטוס המשימה. אנא נסה שוב.");
                  }
                }}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 hidden sm:inline-flex"
              >
                {getStatusText()}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditForm(true)}
                className={`text-xs sm:text-sm p-1 sm:p-2 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title={t('tasks.editTask')}
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPlanningChat(true)}
                className={`text-xs sm:text-sm p-1 sm:p-2 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200'
                }`}
                title={t('tasks.taskPlanningControl')}
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFocusTimer(true)}
                className={`text-xs sm:text-sm p-1 sm:p-2 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500' 
                    : 'bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 border-green-200'
                }`}
                title={t('focus.focusTimer')}
              >
                <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          </CardContent>
      </Card>

      {/* Task Planning Chat Modal */}
      {showPlanningChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <TaskPlanningChat
              task={task}
              goal={goal}
              onClose={() => setShowPlanningChat(false)}
              onCreateSubTask={onCreateSubTask}
            />
          </div>
        </div>
      )}

      {/* Task Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <TaskEditForm
              task={task}
              goal={goal}
              onClose={() => setShowEditForm(false)}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>
        </div>
      )}

      {/* Focus Timer Modal */}
      <FocusTimer
        task={task}
        isOpen={showFocusTimer}
        onClose={() => setShowFocusTimer(false)}
      />
    </>
  );
}

TaskItem.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['pending', 'in_progress', 'completed', 'paused']).isRequired,
    due_date: PropTypes.string,
    dueDate: PropTypes.string,
    difficulty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    estimated_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    estimatedTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    points_earned: PropTypes.number,
    priority: PropTypes.oneOf(['low', 'medium', 'high', 'urgent'])
  }).isRequired,
  goal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string.isRequired
  }),
  onStatusChange: PropTypes.func.isRequired,
  showGoalInfo: PropTypes.bool,
  onCreateSubTask: PropTypes.func,
  onTaskUpdate: PropTypes.func
};