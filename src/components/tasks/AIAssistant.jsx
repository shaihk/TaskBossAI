import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { InvokeLLM } from "@/api/integrations";
import { 
  Sparkles, 
  MessageCircle, 
  Lightbulb, 
  Clock, 
  Target,
  X,
  Send
} from "lucide-react";

export default function AIAssistant({ onTaskCreate, onClose }) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState([]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { type: "user", content: message };
    setConversation(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const result = await InvokeLLM({
        prompt: `אתה עוזר AI מתקדם למנהל משימות. המשתמש כתב: "${message}"
        
        תן תשובה מועילה ומעשית. אם המשתמש מבקש עזרה ביצירת משימות, פירוק משימות גדולות, או תכנון זמנים - תספק הצעות קונקרטיות.
        
        אם אתה מציע משימות, תכלול:
        1. כותרת ברורה
        2. תיאור קצר
        3. הערכת זמן בדקות
        4. רמת קושי (1-10)
        5. קטגוריה מתאימה
        6. עדיפות
        
        תמיד תענה בעברית בצורה ידידותית ומעודדת.`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            suggested_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  estimated_time: { type: "number" },
                  difficulty: { type: "number" },
                  category: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      const aiMessage = { type: "ai", content: result.response };
      setConversation(prev => [...prev, aiMessage]);
      
      if (result.suggested_tasks && result.suggested_tasks.length > 0) {
        setSuggestedTasks(result.suggested_tasks);
      }
    } catch (error) {
      console.error("Error with AI assistant:", error);
      const errorMessage = { type: "ai", content: "מצטער, אירעה שגיאה. אנא נסה שוב." };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = (task) => {
    onTaskCreate({
      ...task,
      status: "pending",
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
    });
  };

  const quickPrompts = [
    "עזור לי לתכנן את היום שלי",
    "איך אני יכול לשפר את הפרודוקטיביות שלי?",
    "תן לי משימות למטרת בריאות",
    "עזור לי לפרק פרויקט גדול למשימות קטנות",
    "תמליץ על משימות למטרת למידה"
  ];

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span>עוזר AI</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Prompts */}
        {conversation.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">בחר שאלה מהירה או כתב שאלה משלך:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(prompt)}
                  className="text-xs"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        {conversation.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {conversation.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.type === "user" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-100 text-gray-900"
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested Tasks */}
        {suggestedTasks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              משימות מוצעות
            </h4>
            <div className="space-y-2">
              {suggestedTasks.map((task, index) => (
                <div key={index} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium">{task.title}</h5>
                    <Button
                      size="sm"
                      onClick={() => handleCreateTask(task)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      צור משימה
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {task.estimated_time} דקות
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      קושי: {task.difficulty}/10
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="שאל אותי כל שאלה..."
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}