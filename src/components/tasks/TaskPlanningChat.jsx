
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InvokeLLM } from "@/api/integrations";
import { useTranslation } from "react-i18next";
import { 
  X, 
  Send, 
  Sparkles, 
  CheckSquare, 
  List, 
  ArrowRight,
  Lightbulb,
  Settings,
  Plus,
  Target
} from "lucide-react";

export default function TaskPlanningChat({ task, goal, onClose, onCreateSubTask }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      type: "ai",
      content: t('taskPlanning.greeting', { title: task.title })
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [stepByStepGuide, setStepByStepGuide] = useState(null);
  const [suggestedSubTasks, setSuggestedSubTasks] = useState([]);

  const quickActions = [
    { id: "step_guide", label: t('taskPlanning.stepGuide'), icon: List },
    { id: "breakdown", label: t('taskPlanning.breakdown'), icon: CheckSquare },
    { id: "tips", label: t('taskPlanning.tips'), icon: Lightbulb },
    { id: "troubleshoot", label: t('taskPlanning.troubleshoot'), icon: Settings }
  ];

  const sendMessage = async (message = newMessage, isQuickAction = false) => {
    if (!message.trim() && !isQuickAction) return;

    const userMessage = { type: "user", content: message };
    if (!isQuickAction) {
      setMessages(prev => [...prev, userMessage]);
      setNewMessage("");
    }
    setIsLoading(true);

    try {
      const context = `
המשימה: ${task.title}
תיאור המשימה: ${task.description || 'אין תיאור'}
היעד הראשי: ${goal?.title || 'לא משויך ליעד'}
קטגוריה: ${goal?.category || 'לא צוין'}
רמת קושי: ${task.difficulty || 'לא צוין'}/10
זמן מוערך: ${task.estimated_time || 'לא צוין'} דקות
      `;

      let prompt = "";
      
      if (message === "step_guide") {
        prompt = `בהתבסס על המשימה "${task.title}", תן לי מדריך צעד אחר צעד מפורט איך לבצע את המשימה הזו. 

המדריך צריך להיות:
- מפורט וקונקרטי עם לפחות 5-8 צעדים
- עם צעדים ברורים ומספרים
- כולל הוראות מדויקות (איפה ללחוץ, מה לבחור, איך לגשת)
- עם טיפים חשובים לכל צעד

למשל, אם זה משימה דיגיטלית - תן הוראות מדויקות איפה ללחוץ, איזה תפריטים לפתוח, מה לבחור.

תמיד תענה בעברית ובצורה מקצועית.`;
        
      } else if (message === "breakdown") {
        prompt = `בהתבסס על המשימה "${task.title}", פרק אותה ל-4-7 משימות משנה קטנות ומנוהלות.

כל משימת משנה צריכה להיות:
- קונקרטית וברורה
- ניתנת לביצוע ב-15-45 דקות
- עם תוצאה מדידה וברורה
- מתקדמת לוגית אחת אחרי השנייה

תמיד תענה בעברית.`;

      } else if (message === "tips") {
        prompt = `תן לי עצות מקצועיות ומעשיות לביצוע המשימה "${task.title}".

כלול:
- 4-6 טיפים חשובים להצלחה
- מלכודות נפוצות להימנע מהן
- כלים או משאבים מומלצים
- דרכים לשפר את התוצאות
- טיפים לחיסכון בזמן

תמיד תענה בעברית.`;

      } else if (message === "troubleshoot") {
        prompt = `מה הבעיות והקשיים הנפוצים ביותר בביצוע המשימה "${task.title}" ואיך לפתור אותם?

כלול:
- 3-5 בעיות טכניות נפוצות ופתרונות
- קשיים תהליכיים ואיך להתמודד
- פתרונות מעשיים לכל בעיה
- דרכים למניעת בעיות מראש
- מה לעשות כשדברים לא עובדים

תמיד תענה בעברית.`;

      } else {
        prompt = `אתה יועץ מקצועי ומתכנן משימות מומחה. הקונטקסט שלך:
${context}

המשתמש שאל: "${message}"

תן תשובה מועילה, מקצועית ומפורטת שתעזור למשתמש להצליח במשימה. אם מתאים, הצע צעדים קונקרטיים או משימות משנה.

תמיד תענה בעברית בצורה ברורה ומעשית.`;
      }

      const result = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            step_by_step_guide: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "string" },
                  description: { type: "string" },
                  tips: { type: "array", items: { type: "string" } }
                }
              }
            },
            suggested_subtasks: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } },
            tips_and_advice: { type: "array", items: { type: "string" } }, // Added schema
            common_problems: { // Added schema
              type: "array",
              items: {
                type: "object",
                properties: {
                  problem: { type: "string" },
                  solution: { type: "string" }
                }
              }
            }
          }
        }
      });

      const aiMessage = { type: "ai", content: result.response };
      setMessages(prev => [...prev, aiMessage]);
      
      // Clear previous results
      setStepByStepGuide(null);
      setSuggestedSubTasks([]);
      setSuggestedActions([]);
      
      if (result.step_by_step_guide && result.step_by_step_guide.length > 0) {
        setStepByStepGuide(result.step_by_step_guide);
      }
      
      if (result.suggested_subtasks && result.suggested_subtasks.length > 0) {
        setSuggestedSubTasks(result.suggested_subtasks);
      }

      if (result.action_items && result.action_items.length > 0) {
        setSuggestedActions(result.action_items);
      }

      if (result.tips_and_advice && result.tips_and_advice.length > 0) {
        setSuggestedActions(result.tips_and_advice);
      }

      if (result.common_problems && result.common_problems.length > 0) {
        setSuggestedActions(result.common_problems.map(p => `בעיה: ${p.problem} | פתרון: ${p.solution}`));
      }
    } catch (error) {
      console.error("Error with AI planning chat:", error);
      const errorMessage = { type: "ai", content: t('ai.error') };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionId) => {
    const action = quickActions.find(a => a.id === actionId);
    if (action) {
      setMessages(prev => [...prev, { type: "user", content: action.label }]);
      sendMessage(actionId, true);
    }
  };

  const createSubTask = (subTaskTitle) => {
    if (onCreateSubTask) {
      onCreateSubTask(subTaskTitle);
    }
    setSuggestedSubTasks(prev => prev.filter(t => t !== subTaskTitle));
  };

  return (
    <Card className="glass-effect border-0 shadow-xl max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg">{t('taskPlanning.title')}</span>
              <p className="text-sm text-gray-600 font-normal">"{task.title}"</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                onClick={() => handleQuickAction(action.id)}
                className="flex flex-col items-center gap-2 h-auto py-3"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs text-center">{action.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Chat Messages */}
        <ScrollArea className="h-64 border rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-900 shadow-sm border'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 shadow-sm border px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Step by Step Guide - עם גלילה מתוקנת */}
        {stepByStepGuide && stepByStepGuide.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <List className="w-5 h-5 text-blue-600" />
                {t('taskPlanning.stepGuideTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96 pr-4">
                <div className="space-y-4">
                  {stepByStepGuide.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{step.step}</h4>
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">{step.description}</p>
                        {step.tips && step.tips.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-blue-700">💡 {t('taskPlanning.importantTips')}:</p>
                            <ul className="space-y-1">
                              {step.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="text-xs text-gray-600 flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Suggested Sub Tasks */}
        {suggestedSubTasks.length > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-600" />
                {t('taskPlanning.suggestedSubTasks')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestedSubTasks.map((subTask, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-800">{subTask}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => createSubTask(subTask)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {t('taskPlanning.addTask')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggested Actions */}
        {suggestedActions.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                {t('taskPlanning.recommendedActions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suggestedActions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded border border-purple-200">
                    <ArrowRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-800">{action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message Input */}
        <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('taskPlanning.inputPlaceholder')}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!newMessage.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
