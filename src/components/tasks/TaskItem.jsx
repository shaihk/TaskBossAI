import { useState } from "react";
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
  Lightbulb,
  Loader2,
  Settings,
  Edit,
  Timer
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { InvokeLLM } from "@/api/integrations";
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

export default function TaskItem({ task, goal, onStatusChange, showGoalInfo = true, onCreateSubTask, onTaskUpdate }) {
  const { t, i18n } = useTranslation();
  const StatusIcon = statusIcons[task.status];
  const isCompleted = task.status === "completed";
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted;
  
  const [showAdvice, setShowAdvice] = useState(false);
  const [taskAdvice, setTaskAdvice] = useState(null);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);
  const [showPlanningChat, setShowPlanningChat] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const { isDarkMode } = useTheme();

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

  const getTaskAdvice = async () => {
    setIsGettingAdvice(true);
    try {
      const context = goal ? `היעד הראשי: ${goal.title}. ` : '';
      const result = await InvokeLLM({
        prompt: `${context}אני צריך עצות איך להשלים את המשימה: "${task.title}". ${task.description ? `תיאור: ${task.description}` : ''}

תן לי עצות מעשיות ופעולות קונקרטיות שיעזרו לי להצליח במשימה. כלול טיפים להתמודדות עם קשיים ודרכים לשמור על מוטיבציה.

תמיד תענה בעברית בצורה ידידותית ומעשית.`,
        response_json_schema: {
          type: "object",
          properties: {
            advice_tips: { type: "array", items: { type: "string" } },
            action_steps: { type: "array", items: { type: "string" } },
            motivation_tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      console.log("Task advice result:", result);
      setTaskAdvice(result);
      setShowAdvice(true);
    } catch (error) {
      console.error("Error getting task advice:", error);
      alert("שגיאה בקבלת עצות מהמערכת. אנא נסה שוב.");
    } finally {
      setIsGettingAdvice(false);
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
      <Card className={`glass-effect border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
        isCompleted ? "bg-green-50" : isOverdue ? "bg-red-50" : ""
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Status Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(task, getNextStatus())}
              className="p-1 hover:bg-transparent"
            >
              <StatusIcon className={`w-6 h-6 ${statusColors[task.status]}`} />
            </Button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-semibold ${
                  isCompleted ? "line-through text-gray-500" : "text-gray-900"
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
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              )}

              {/* Goal Info */}
              {showGoalInfo && goal && (
                <div className="mb-2">
                  <Link to={createPageUrl(`Goals?goal=${goal.id}`)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                    <span>{t('tasks.goalLabel', { title: goal.title })}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Task Meta */}
              <div className="flex flex-wrap gap-2 mb-2">
                {task.difficulty && (
                  <Badge variant="outline">
                    {t('tasks.difficulty', { level: task.difficulty })}
                  </Badge>
                )}
                {task.estimated_time && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t('tasks.estimatedTime', { time: task.estimated_time })}
                  </Badge>
                )}
              </div>

              {/* Due Date */}
              {task.due_date && (
                <div className={`flex items-center gap-1 text-sm ${
                  isOverdue ? "text-red-600" : "text-gray-500"
                }`}>
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(task.due_date), "d MMMM yyyy", { locale: i18n.language === 'he' ? he : undefined })}
                  </span>
                  {isOverdue && <span className="font-medium">{t('tasks.overdue')}</span>}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(task, getNextStatus())}
                className="text-sm"
              >
                {getStatusText()}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditForm(true)}
                className={`text-sm ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title={t('tasks.editTask')}
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPlanningChat(true)}
                className={`text-sm ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500' 
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200'
                }`}
                title={t('tasks.taskPlanningControl')}
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFocusTimer(true)}
                className={`text-sm ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500' 
                    : 'bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 border-green-200'
                }`}
                title={t('focus.focusTimer')}
              >
                <Timer className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={getTaskAdvice}
                disabled={isGettingAdvice}
                className={`text-sm ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500 disabled:bg-gray-800 disabled:text-gray-500' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title={t('tasks.adviseMe')}
              >
                {isGettingAdvice ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Task Advice */}
          {showAdvice && taskAdvice && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-green-800 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  {t('tasks.taskCompletionAdvice')}
                </h4>
                <Button variant="ghost" size="sm" onClick={() => setShowAdvice(false)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-3 text-sm">
                {taskAdvice.advice_tips && taskAdvice.advice_tips.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-700 mb-1">{t('tasks.practicalAdvice')}</h5>
                    <ul className="space-y-1">
                      {taskAdvice.advice_tips.map((tip, i) => (
                        <li key={i} className="text-gray-700 flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {taskAdvice.action_steps && taskAdvice.action_steps.length > 0 && (
                  <div>
                    <h5 className="font-medium text-blue-700 mb-1">{t('tasks.recommendedActions')}</h5>
                    <ul className="space-y-1">
                      {taskAdvice.action_steps.map((step, i) => (
                        <li key={i} className="text-gray-700 flex items-start gap-2">
                          <span className="text-blue-600 font-bold">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {taskAdvice.motivation_tips && taskAdvice.motivation_tips.length > 0 && (
                  <div>
                    <h5 className="font-medium text-purple-700 mb-1">{t('tasks.motivationTips')}</h5>
                    <ul className="space-y-1">
                      {taskAdvice.motivation_tips.map((tip, i) => (
                        <li key={i} className="text-gray-700 flex items-start gap-2">
                          <span className="text-purple-600">💡</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
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
    difficulty: PropTypes.string,
    estimated_time: PropTypes.string,
    points_earned: PropTypes.number
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