// ChatBot — floating AI shopping assistant widget.
// Features: multi-turn chat, new-chat button, typing indicator, auto-scroll.
import { useEffect, useRef, useState } from 'react';
import { smartSearch } from '../api/ai';

const BOT_AVATAR = '🛍️';
const USER_AVATAR = '👤';

function TypingDots() {
  return (
    <div className="chat-typing-dots">
      <span /><span /><span />
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`chat-message-row ${isUser ? 'chat-message-row--user' : 'chat-message-row--bot'}`}>
      {!isUser && <div className="chat-avatar chat-avatar--bot">{BOT_AVATAR}</div>}
      <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--bot'}`}>
        {msg.content}
      </div>
      {isUser && <div className="chat-avatar chat-avatar--user">{USER_AVATAR}</div>}
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      content: "Hi! I'm your AI shopping assistant 🛍️ Ask me anything about our products — specs, pricing, comparisons, and more!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, open]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function startNewChat() {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'bot',
        content: "New chat started! Ask me anything about our products 🛍️",
      },
    ]);
    setInput('');
    setLoading(false);
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await smartSearch(text);
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: data.ai || "I'm not sure about that. Try asking about a specific product!",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          content: '⚠️ Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        id="chatbot-toggle"
        onClick={() => setOpen((o) => !o)}
        className="chatbot-fab"
        aria-label="Toggle AI assistant"
        title="AI Shopping Assistant"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {!open && <span className="chatbot-fab-badge">AI</span>}
      </button>

      {/* Chat window */}
      {open && (
        <div id="chatbot-panel" className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-header-avatar">🛍️</div>
              <div>
                <p className="chatbot-header-title">Shopping Assistant</p>
                <p className="chatbot-header-subtitle">Powered by AI · Always ready</p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                id="chatbot-new-chat"
                onClick={startNewChat}
                className="chatbot-action-btn"
                title="New Chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span>New</span>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="chatbot-close-btn"
                title="Close"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {loading && (
              <div className="chat-message-row chat-message-row--bot">
                <div className="chat-avatar chat-avatar--bot">{BOT_AVATAR}</div>
                <div className="chat-bubble chat-bubble--bot chat-bubble--typing">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="chatbot-suggestions">
              {['Best laptops?', 'Show me phones', 'Cheapest product?', 'Compare headphones'].map((s) => (
                <button
                  key={s}
                  className="chatbot-suggestion-chip"
                  onClick={() => {
                    setInput(s);
                    setTimeout(() => {
                      setInput(s);
                      sendMessage({ preventDefault: () => {} });
                    }, 0);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="chatbot-input-area">
            <textarea
              ref={inputRef}
              id="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any product…"
              className="chatbot-input"
              rows={1}
              disabled={loading}
            />
            <button
              id="chatbot-send"
              type="submit"
              disabled={!input.trim() || loading}
              className="chatbot-send-btn"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
