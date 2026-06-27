import React from 'react';
import { ChatMessage } from '../types';
import { Bot, User } from 'lucide-react';

interface ChatBubbleProps {
  message: ChatMessage;
  onSuggestionClick?: (suggestionText: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onSuggestionClick }) => {
  const isAssistant = message.role === 'assistant';

  // Quick formatter to bold **text** in messages without full markdown package overhead
  const formatContent = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-indigo-200">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex items-start space-x-3.5 ${isAssistant ? '' : 'flex-row-reverse space-x-reverse'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
        isAssistant 
          ? 'bg-accent/15 border-accent/30 text-accent' 
          : 'bg-slate-800 border-slate-700 text-slate-300'
      }`}>
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Bubble Content */}
      <div className="max-w-[85%] space-y-2">
        <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
          isAssistant 
            ? 'bg-slate-900 border-slate-800 text-slate-300 rounded-tl-sm' 
            : 'bg-accent text-white border-indigo-500 rounded-tr-sm shadow-md shadow-accent-glow/20'
        }`}>
          {formatContent(message.content)}
        </div>

        {/* Timestamp */}
        <span className={`text-[10px] text-slate-500 block ${!isAssistant ? 'text-right' : ''}`}>
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};
