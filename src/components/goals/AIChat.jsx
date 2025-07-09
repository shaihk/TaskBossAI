import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { chat } from "@/api/integrations";
import { X, Send, MessageCircle, Sparkles, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AIChat({ goal, tasks, onClose, onTaskCreate }) {
  const { t, i18n } = useTranslation();
  
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: t('ai.greeting', { title: goal.title })
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = { role: "user", content: newMessage };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setNewMessage("");
    setIsLoading(true);

    try {
      const context = `
        The main goal is: ${goal.title}
        The goal description is: ${goal.description || 'No description'}
        The category is: ${goal.category}
        The priority is: ${goal.priority}
        Existing tasks are: ${tasks.map(t => `${t.title} (${t.status})`).join(', ') || 'No tasks'}
      `;

      const languageInstruction = i18n.language === 'he' 
        ? 'You should always answer in Hebrew in a friendly and encouraging tone.'
        : 'You should always answer in English in a friendly and encouraging tone.';
      
      const systemMessage = {
        role: "system",
        content: `You are an advanced consultant and assistant for achieving goals. Your context is:\n${context}\n\n${languageInstruction}`
      };

      const result = await chat([systemMessage, ...newMessages]);

      const aiMessage = { role: "assistant", content: result.message.content };
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error("Error with AI chat:", error);
      const errorMessage = { role: "assistant", content: t('ai.error') };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-effect border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span>{t('ai.chatTitle')}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="h-64 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-900 shadow-sm'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 shadow-sm px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('ai.askQuestionPlaceholder')}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
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