import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `You are Lars, an AI sales intelligence agent built for Charles Keatts at Clairio.

Your job is to help Charles with:
- Researching prospects and accounts (companies, contacts, decision-makers)
- Drafting and reviewing outbound emails and follow-ups
- Summarizing deal status and next steps
- Identifying feature gaps and competitive signals
- Preparing for sales calls and QBRs

You have deep context on enterprise sales patterns from Charles's 9 years at IBM, including:
- Feature Gap Negotiation dynamics
- Silent Feature Signal detection
- ARR weighting logic
- The Broken Signal Chain problem

Be direct, specific, and commercially minded. Always tie recommendations to revenue impact.
When researching companies, focus on: buying signals, decision-maker identification, competitive positioning, and deal-closing intelligence.`

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: nextMessages,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const assistantText = data.content?.[0]?.text ?? ''
      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      sendMessage(e)
    }
  }

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <span style={styles.logo}>Lars</span>
        <span style={styles.subtitle}>AI Sales Agent — Clairio</span>
      </header>

      <div style={styles.feed}>
        {messages.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>Ready.</p>
            <p style={styles.emptyHint}>Ask Lars to research a prospect, draft an email, or analyze a deal.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
            <span style={msg.role === 'user' ? styles.userLabel : styles.assistantLabel}>
              {msg.role === 'user' ? 'You' : 'Lars'}
            </span>
            <p style={styles.messageText}>{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div style={styles.assistantBubble}>
            <span style={styles.assistantLabel}>Lars</span>
            <p style={{ ...styles.messageText, opacity: 0.4 }}>Thinking...</p>
          </div>
        )}
        {error && (
          <div style={styles.errorBox}>
            <strong>Error:</strong> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={styles.inputArea}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Lars anything about a prospect, deal, or email..."
          rows={1}
          style={styles.textarea}
          disabled={loading}
        />
        <button type="submit" disabled={!input.trim() || loading} style={styles.sendBtn}>
          Send
        </button>
      </form>
    </div>
  )
}

const styles = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: 800,
    margin: '0 auto',
    padding: '0 16px',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    padding: '20px 0 16px',
    borderBottom: '1px solid #1e1e24',
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.5px',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  feed: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  empty: {
    margin: 'auto',
    textAlign: 'center',
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '75%',
    background: '#1a1a2e',
    borderRadius: 12,
    padding: '12px 16px',
    border: '1px solid #2a2a40',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    background: '#141418',
    borderRadius: 12,
    padding: '12px 16px',
    border: '1px solid #1e1e24',
  },
  userLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    display: 'block',
    marginBottom: 6,
  },
  assistantLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#4ade80',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    display: 'block',
    marginBottom: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  errorBox: {
    background: '#2a0a0a',
    border: '1px solid #5a1a1a',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#ff8080',
  },
  inputArea: {
    display: 'flex',
    gap: 10,
    padding: '16px 0 24px',
    borderTop: '1px solid #1e1e24',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    background: '#141418',
    border: '1px solid #2a2a38',
    borderRadius: 10,
    color: '#e8e8e8',
    fontSize: 14,
    lineHeight: 1.5,
    padding: '12px 14px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    minHeight: 46,
    maxHeight: 200,
  },
  sendBtn: {
    background: '#6b7fff',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    height: 46,
    flexShrink: 0,
    opacity: 1,
    transition: 'opacity 0.15s',
  },
}
