import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ChatBubble } from '../components/ChatBubble';
import { ChatMessage } from '../types';
import { mockChatResponses } from '../mock/auditData';
import { Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      role: 'assistant',
      content: "Hello! I am your AI UX Auditor. I have cataloged shoppycart.io's sitemap and accessibility violations. Ask me questions like: \n\n* **Why is Checkout page bad?**\n* **Show all accessibility issues.**\n* **Which page has highest severity?**\n* **How do I improve navigation?**\n\nI can also write code patches directly for your components.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Why is Checkout page bad?",
    "Show all accessibility issues.",
    "Which page has highest severity?",
    "How do I improve navigation?"
  ];

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Create user message
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate response delay
    setTimeout(() => {
      // Find answer or use default generic response
      const matched = mockChatResponses[text];
      const replyText = matched 
        ? matched.reply 
        : `I searched the violations database for "${text}", but I couldn't find a direct correlation. You can review the **Reports** tab to see all category distribution charts or ask me about contrast issues specifically.`;

      const assistantMsg: ChatMessage = {
        id: `m-${Date.now()}-assistant`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] text-left">
        
        {/* Page Header */}
        <div className="pb-4 border-b border-slate-800/60 shrink-0">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white flex items-center">
                Conversational UX Assistant
                <span className="ml-3 inline-flex items-center text-[10px] tracking-wide font-extrabold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                  <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
                  Audit Copilot
                </span>
              </h2>
              <p className="text-slate-400 text-sm">Consult our auditor agent regarding code modifications, screen failures, and compliance suggestions.</p>
            </div>
            <button 
              onClick={() => setMessages(prev => [prev[0]])}
              className="p-2 text-slate-500 hover:text-slate-350 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 transition-colors"
              title="Clear conversation log"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Pane */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2 scroll-smooth">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}

          {/* Typing Indicator bubbles */}
          {isTyping && (
            <div className="flex items-center space-x-3.5">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 rounded-tl-sm flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Bottom controls panel */}
        <div className="pt-4 border-t border-slate-800/60 shrink-0 space-y-4">
          
          {/* Suggested Prompts buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center mr-1">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              Suggested:
            </span>
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                disabled={isTyping}
                className="text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-slate-700 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="flex items-center space-x-3 p-2 bg-slate-900 border border-slate-850 rounded-xl focus-within:border-accent transition-colors duration-250 shadow-glass">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isTyping}
              placeholder="Ask a question (e.g. 'How do I fix the alt text issue?')"
              className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-slate-200 text-sm placeholder-slate-500 py-2.5 px-3 disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="p-3 bg-accent hover:bg-indigo-750 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600 shadow-md shadow-accent-glow"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};
export default Assistant;
