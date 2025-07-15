
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chat } from "@/api/integrations";
import { useTranslation } from "react-i18next";
import { 
  X, 
  Send, 
  Sparkles, 
  CheckSquare, 
  List, 
  Lightbulb,
  Settings,
} from "lucide-react";
import PropTypes from 'prop-types';

export default function TaskPlanningChat({ task, goal, onClose }) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: t('taskPlanning.greeting', { title: task.title })
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = [
    { id: "step_guide", label: t('taskPlanning.stepGuide'), icon: List, prompt: t('taskPlanning.prompts.stepGuide', { title: task.title }) },
    { id: "breakdown", label: t('taskPlanning.breakdown'), icon: CheckSquare, prompt: t('taskPlanning.prompts.breakdown', { title: task.title }) },
    { id: "tips", label: t('taskPlanning.tips'), icon: Lightbulb, prompt: t('taskPlanning.prompts.tips', { title: task.title }) },
    { id: "troubleshoot", label: t('taskPlanning.troubleshoot'), icon: Settings, prompt: t('taskPlanning.prompts.troubleshoot', { title: task.title }) }
  ];

  const sendMessage = async (messageContent) => {
    if (!messageContent.trim()) return;

    const userMessage = { role: "user", content: messageContent };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setNewMessage("");
    setIsLoading(true);

    try {
      const context = `
        ${t('taskPlanning.context.task')}: ${task.title}
        ${t('taskPlanning.context.description')}: ${task.description || t('taskPlanning.context.noDescription')}
        ${t('taskPlanning.context.mainGoal')}: ${goal?.title || t('taskPlanning.context.notAssociated')}
        ${t('taskPlanning.context.category')}: ${goal?.category || t('taskPlanning.context.notSpecified')}
        ${t('taskPlanning.context.difficulty')}: ${task.difficulty || t('taskPlanning.context.notSpecified')}/10
        ${t('taskPlanning.context.estimatedTime')}: ${task.estimated_time || t('taskPlanning.context.notSpecified')} ${t('taskPlanning.context.minutes')}
      `;
      
      const currentLang = i18n.language;
      const languageMap = {
        'he': 'Hebrew',
        'ru': 'Russian',
        'en': 'English'
      };
      const responseLang = languageMap[currentLang] || 'English';

      const systemMessage = {
        role: "system",
        content: `You are an expert task planner and assistant. Your context is:\n${context}\n\nThe user is asking for help with this task. 
        
IMPORTANT: You MUST respond ONLY in ${responseLang} language. Always answer in ${responseLang} with a professional and helpful tone.`
      };

      const result = await chat([systemMessage, ...newMessages]);

      const aiMessage = { role: "assistant", content: result.message.content };
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error("Error with AI planning chat:", error);
      const errorMessage = { role: "assistant", content: t('ai.error') };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    setMessages(prev => [...prev, { role: "user", content: action.label }]);
    sendMessage(action.prompt);
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
              <p className="text-sm text-gray-600 font-normal">&ldquo;{task.title}&rdquo;</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                onClick={() => handleQuickAction(action)}
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
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'user' 
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

        {/* Message Input */}
        <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('taskPlanning.inputPlaceholder')}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage(newMessage)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage(newMessage)}
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

TaskPlanningChat.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    description: PropTypes.string,
    difficulty: PropTypes.number,
    estimated_time: PropTypes.number
  }).isRequired,
  goal: PropTypes.shape({
    title: PropTypes.string,
    category: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onCreateSubTask: PropTypes.func
};
