import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiAsk, removeToken } from '../api';
import './ChatPage.css';

export default function ChatPage() {
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const filename = location.state?.filename ?? `Document #${documentId}`;

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = async (e) => {
    e?.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setQuestion('');
    setError('');
    const userMsg = { id: Date.now(), role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await apiAsk(q, parseInt(documentId, 10));
      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: res.answer,
        chunks: res.chunks_used,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      if (err.message.includes('401')) { removeToken(); navigate('/login'); return; }
      setError(err.message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div className="chat-layout">
      {/* Top bar */}
      <header className="chat-topbar">
        <button id="back-to-dashboard" className="btn btn-ghost chat-back" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        <div className="chat-doc-info">
          <div className="chat-doc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <span className="chat-doc-name">{filename}</span>
            <span className="chat-doc-id">ID #{documentId}</span>
          </div>
        </div>
        <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Active</span>
      </header>

      {/* Messages */}
      <div className="chat-messages" id="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2>Ask anything about this document</h2>
            <p>DocMind will search through the document and answer your question.</p>
            <div className="chat-suggestions">
              {['Summarize this document', 'What are the key points?', 'What conclusions are drawn?'].map(s => (
                <button
                  key={s}
                  className="suggestion-chip"
                  onClick={() => { setQuestion(s); inputRef.current?.focus(); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="message-avatar assistant-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
            )}
            <div className="message-bubble">
              <p className="message-text">{msg.text}</p>
              {msg.role === 'assistant' && msg.chunks != null && (
                <span className="message-meta">Based on {msg.chunks} chunk{msg.chunks !== 1 ? 's' : ''}</span>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="message-avatar user-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="message-row assistant">
            <div className="message-avatar assistant-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
            <div className="message-bubble typing-bubble">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}

        {error && (
          <div className="error-msg" style={{ maxWidth: 500, alignSelf: 'center' }}>
            <span>⚠</span>{error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <form onSubmit={submit} className="chat-input-form">
          <textarea
            ref={inputRef}
            id="chat-input"
            className="chat-textarea"
            placeholder="Ask a question about this document…"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading}
          />
          <button
            id="send-btn"
            type="submit"
            className="btn btn-primary send-btn"
            disabled={loading || !question.trim()}
            aria-label="Send"
          >
            {loading
              ? <span className="spinner" />
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
            }
          </button>
        </form>
        <p className="chat-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line</p>
      </div>
    </div>
  );
}
