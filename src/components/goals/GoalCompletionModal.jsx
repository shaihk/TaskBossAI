import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, Save, Trophy, Star, Clock, Target } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const satisfactionLevels = [
  { value: 1, label: "מאוד לא מרוצה", color: "text-red-600" },
  { value: 2, label: "לא מרוצה", color: "text-orange-600" },
  { value: 3, label: "בסדר", color: "text-yellow-600" },
  { value: 4, label: "מרוצה", color: "text-green-600" },
  { value: 5, label: "מאוד מרוצה", color: "text-green-700" }
];

const completionStatus = [
  { value: "completed", label: "הושלם במלואו", icon: Trophy, color: "bg-green-100 text-green-800" },
  { value: "partial", label: "הושלם חלקית", icon: Star, color: "bg-yellow-100 text-yellow-800" },
  { value: "abandoned", label: "נטוש", icon: X, color: "bg-red-100 text-red-800" }
];

export default function GoalCompletionModal({ goal, tasks, isOpen, onClose, onComplete }) {
  const [formData, setFormData] = useState({
    completion_status: "completed",
    satisfaction_level: 4,
    lessons_learned: "",
    what_worked: "",
    what_didnt_work: "",
    would_do_differently: "",
    final_thoughts: "",
    time_taken: goal.estimated_time || 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const completionData = {
        ...formData,
        completed_at: new Date().toISOString(),
        completion_memo: {
          satisfaction_level: formData.satisfaction_level,
          lessons_learned: formData.lessons_learned,
          what_worked: formData.what_worked,
          what_didnt_work: formData.what_didnt_work,
          would_do_differently: formData.would_do_differently,
          final_thoughts: formData.final_thoughts,
          actual_time_taken: formData.time_taken,
          completed_tasks: tasks.filter(t => t.status === 'completed').length,
          total_tasks: tasks.length
        }
      };

      await onComplete(completionData);
      onClose();
    } catch (error) {
      console.error("Error completing goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-effect border-0 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl">סיום היעד</h2>
                <p className="text-sm text-gray-600 font-normal">{goal.title}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Goal Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{completedTasks}/{tasks.length}</p>
                  <p className="text-sm text-gray-600">משימות הושלמו</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{progressPercentage}%</p>
                  <p className="text-sm text-gray-600">אחוז השלמה</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{formData.time_taken || 0}</p>
                  <p className="text-sm text-gray-600">דקות בפועל</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Status */}
          <div className="space-y-3">
            <Label className="text-base font-medium">סטטוס סיום היעד</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {completionStatus.map((status) => {
                const StatusIcon = status.icon;
                return (
                  <div
                    key={status.value}
                    onClick={() => handleInputChange("completion_status", status.value)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.completion_status === status.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon className="w-5 h-5" />
                      <span className="font-medium">{status.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Taken */}
          <div className="space-y-3">
            <Label className="text-base font-medium">זמן שלקח בפועל (דקות)</Label>
            <div className="space-y-2">
              <Slider
                value={[formData.time_taken]}
                onValueChange={(value) => handleInputChange("time_taken", value[0])}
                max={Math.max(goal.estimated_time * 3, 1000)}
                min={0}
                step={15}
                className="mt-2"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>0 דקות</span>
                <span className="font-medium">{formData.time_taken} דקות</span>
                <span>{Math.max(goal.estimated_time * 3, 1000)} דקות</span>
              </div>
              {goal.estimated_time && (
                <p className="text-xs text-gray-500">
                  הערכה מקורית: {goal.estimated_time} דקות
                  {formData.time_taken !== goal.estimated_time && (
                    <span className={`ml-2 font-medium ${
                      formData.time_taken < goal.estimated_time ? "text-green-600" : "text-red-600"
                    }`}>
                      ({formData.time_taken < goal.estimated_time ? "-" : "+"}
                      {Math.abs(formData.time_taken - goal.estimated_time)} דקות)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Satisfaction Level */}
          <div className="space-y-3">
            <Label className="text-base font-medium">רמת שביעות רצון מהתוצאה</Label>
            <Select 
              value={formData.satisfaction_level.toString()} 
              onValueChange={(value) => handleInputChange("satisfaction_level", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {satisfactionLevels.map(level => (
                  <SelectItem key={level.value} value={level.value.toString()}>
                    <span className={level.color}>{level.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reflection Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="what_worked">מה עבד טוב?</Label>
              <Textarea
                id="what_worked"
                value={formData.what_worked}
                onChange={(e) => handleInputChange("what_worked", e.target.value)}
                placeholder="תאר מה הצליח במיוחד, איזה אסטרטגיות עבדו..."
                rows={4}
              />
            </div>

            <div className="space-y-2">  
              <Label htmlFor="what_didnt_work">מה לא עבד כל כך טוב?</Label>
              <Textarea
                id="what_didnt_work"
                value={formData.what_didnt_work}
                onChange={(e) => handleInputChange("what_didnt_work", e.target.value)}
                placeholder="תאר מה היה מאתגר, איפה נתקלת בקשיים..."
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lessons_learned">לקחים שלמדתי</Label>
            <Textarea
              id="lessons_learned"
              value={formData.lessons_learned}
              onChange={(e) => handleInputChange("lessons_learned", e.target.value)}
              placeholder="מה למדתי על עצמי, על התהליך, על ההגשמה של יעדים..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="would_do_differently">מה הייתי עושה אחרת?</Label>
            <Textarea
              id="would_do_differently"
              value={formData.would_do_differently}
              onChange={(e) => handleInputChange("would_do_differently", e.target.value)}
              placeholder="אילו שינויים הייתי מבצע אם הייתי מתחיל מחדש..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="final_thoughts">מחשבות אחרונות</Label>
            <Textarea
              id="final_thoughts"
              value={formData.final_thoughts}
              onChange={(e) => handleInputChange("final_thoughts", e.target.value)}
              placeholder="תחושות, התרגשות, גאווה, או כל דבר אחר שחשוב לך לזכור..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              ביטול
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      שומר...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      סיים יעד
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>סיום היעד</AlertDialogTitle>
                  <AlertDialogDescription>
                    האם אתה בטוח שברצונך לסיים את היעד "{goal.title}"? 
                    פעולה זו תסמן את היעד כמושלם ותשמור את הזיכרון שרשמת.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>עוד לא</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                    כן, סיים יעד
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}