'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    role: 'assistant',
    content: 'Bonjour ! Je suis ton conseiller pédagogique. Comment puis-je t\'aider dans ton orientation ?\n\nTu peux me poser des questions comme :\n• "Quelles filières pour les maths ?"\n• "C\'est quoi un technicien ?"\n• "Aide-moi à choisir"',
    timestamp: new Date(),
  },
];

export default function ConseillerPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response (replace with real API call)
    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      let response = '';

      if (lowerInput.includes('bonjour') || lowerInput.includes('salut')) {
        response = 'Bonjour ! Je suis ravi de t\'aider. Quelle est ta question sur l\'orientation ?';
      } else if (lowerInput.includes('métier') || lowerInput.includes('carrier')) {
        response = 'Le Bénin offre de nombreuses opportunités à travers les filières techniques, professionnelles et les écoles de métiers. Quel domaine t\'intéresse ? (technique, agricole, commerce...)';
      } else if (lowerInput.includes('filier') || lowerInput.includes('choisir')) {
        response = 'Pour bien choisir, il faut considérer :\n1. Tes matières préférées\n2. Les débouchés concrets\n3. Le taux d\'insertion\n\nQuel aspect veux-tu approfondir ?';
      } else if (lowerInput.includes('salaire') || lowerInput.includes('argent')) {
        response = 'Les salaires varient selon les filières :\n• École de Métiers : 50 000 - 150 000 FCFA\n• Bac Technique : 75 000 - 200 000 FCFA\n• Université : 100 000 - 500 000+ FCFA\n\nVoulez-vous des détails sur un domaine ?';
      } else {
        response = 'Merci pour ta question ! Peux-tu me donner plus de détails pour que je puisse mieux t\'aider ? Par exemple, quel sujet t\'intéresse particulièrement ?';
      }

      const assistantMsg: Message = { role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b border-bj-gray-925 px-4v py-3v">
        <div className="bj-container flex items-center gap-3v">
          <Link href="/" className="text-bj-gray-500 hover:text-bj-green">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-sm">Conseiller pédagogique</h1>
            <p className="text-xs text-bj-gray-500">Assistant intelligent · Français</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4v">
        <div className="bj-container max-w-3xl">
          {messages.map((msg, i) => (
            <div key={i} className={`mb-4v ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
              <div className={msg.role === 'user' ? 'bubble-user max-w-[80%]' : 'bubble-assistant max-w-[80%]'}>
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
                <p className="text-xs text-bj-gray-625 mt-2v">
                  {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="mb-4v">
              <div className="bubble-assistant max-w-[80%]">
                <div className="flex gap-1v">
                  <span className="w-2 h-2 bg-bj-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-bj-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-bj-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-bj-gray-925 px-4v py-3v">
        <div className="bj-container max-w-3xl">
          <div className="flex items-center gap-3v">
            <button className="p-3v rounded-full hover:bg-bj-gray-975 transition-colors" aria-label="Message vocal">
              <Mic size={20} className="text-bj-gray-500" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Écris ton message..."
              className="flex-1 px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-3v bg-bj-green rounded-full text-white hover:bg-bj-green/90 transition-colors disabled:opacity-50"
              aria-label="Envoyer"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
