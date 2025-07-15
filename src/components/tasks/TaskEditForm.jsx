
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { tasksAPI } from "@/services/api";
import { X, Save, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


import PropTypes from 'prop-types';

export default function TaskEditForm({ task, goal, onClose, onTaskUpdate }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: task.title || "",
    description: task.description || "",
    priority: task.priority || "medium",
    difficulty: task.difficulty || 5,
    estimatedTime: task.estimatedTime || task.estimated_time || 30,
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : (task.due_date ? task.due_date.split('T')[0] : new Date().toISOString().split('T')[0]),
    status: task.status || "pending"
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      await tasksAPI.update(task.id, formData);
      setSuccess(true);
      setTimeout(() => {
        onTaskUpdate();
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error updating task:", error);
      setError(error.message || t('form.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('form.editTask')}</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
        {goal && (
          <p className="text-sm text-gray-600">{t('tasks.goalLabel', { title: goal.title })}</p>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">{t('form.updateSuccess')}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('form.taskTitle')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder={t('form.taskTitle')}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('form.detailedDescription')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder={t('form.description')}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority */}
            <div className="space-y-2">
                <Label htmlFor="priority">{t('form.priority')}</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger id="priority">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">{t('form.priority.low')}</SelectItem>
                        <SelectItem value="medium">{t('form.priority.medium')}</SelectItem>
                        <SelectItem value="high">{t('form.priority.high')}</SelectItem>
                        <SelectItem value="urgent">{t('form.priority.urgent')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">{t('form.status')}</Label>
               <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger id="status">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">{t('form.status.pending')}</SelectItem>
                        <SelectItem value="in_progress">{t('form.status.inProgress')}</SelectItem>
                        <SelectItem value="completed">{t('form.status.completed')}</SelectItem>
                        <SelectItem value="paused">{t('form.status.paused')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          {/* Difficulty and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{t('form.difficulty')}: {formData.difficulty}/10</Label>
              <Slider
                value={[formData.difficulty]}
                onValueChange={(value) => handleInputChange("difficulty", value[0])}
                max={10}
                min={1}
                step={1}
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedTime">{t('form.estimatedTime')} ({t('form.minutes')})</Label>
              <Input
                id="estimatedTime"
                type="number"
                value={formData.estimatedTime}
                onChange={(e) => handleInputChange("estimatedTime", parseInt(e.target.value))}
                min={1}
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">{t('form.dueDate')}</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange("dueDate", e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('form.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('form.update')}...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('form.save')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

TaskEditForm.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    priority: PropTypes.string,
    difficulty: PropTypes.number,
    estimatedTime: PropTypes.number,
    estimated_time: PropTypes.number,
    dueDate: PropTypes.string,
    due_date: PropTypes.string,
    status: PropTypes.string
  }).isRequired,
  goal: PropTypes.shape({
    title: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onTaskUpdate: PropTypes.func.isRequired
};
