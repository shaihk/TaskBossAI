
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Task } from "@/api/entities";
import { X, Save, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function TaskEditForm({ task, goal, onClose, onTaskUpdate }) {
  const [formData, setFormData] = useState({
    title: task.title || "",
    description: task.description || "",
    priority: task.priority || "medium",
    difficulty: task.difficulty || 5,
    estimated_time: task.estimated_time || 30,
    due_date: task.due_date ? task.due_date.split('T')[0] : "",
    status: task.status || "pending"
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await Task.update(task.id, formData);
      onTaskUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="glass-effect border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>עריכת משימה</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
        {goal && (
          <p className="text-sm text-gray-600">היעד: {goal.title}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">כותרת המשימה</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="מה צריך לעשות?"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">תיאור מפורט</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="הוסף פרטים נוספים על המשימה..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority */}
            <div className="space-y-2">
                <Label htmlFor="priority">דחיפות</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger id="priority">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">נמוכה</SelectItem>
                        <SelectItem value="medium">בינונית</SelectItem>
                        <SelectItem value="high">גבוהה</SelectItem>
                        <SelectItem value="urgent">דחופה</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">סטטוס המשימה</Label>
               <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger id="status">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">ממתינה</SelectItem>
                        <SelectItem value="in_progress">בביצוע</SelectItem>
                        <SelectItem value="completed">הושלמה</SelectItem>
                        <SelectItem value="paused">מושהית</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          {/* Difficulty and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>רמת קושי: {formData.difficulty}/10</Label>
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
              <Label htmlFor="estimated_time">זמן מוערך (דקות)</Label>
              <Input
                id="estimated_time"
                type="number"
                value={formData.estimated_time}
                onChange={(e) => handleInputChange("estimated_time", parseInt(e.target.value))}
                min={1}
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">תאריך יעד</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange("due_date", e.target.value)}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
