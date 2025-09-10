import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { apiFetch } from '../lib/api';

interface MessageButtonProps {
  targetUserId: string;
  targetUserName: string;
  currentUserId: string;
  onMessageSent?: () => void;
}

// Helper to get auth token
async function withAuth(options: RequestInit = {}): Promise<RequestInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };
}

export default function MessageButton({ 
  targetUserId, 
  targetUserName, 
  currentUserId, 
  onMessageSent 
}: MessageButtonProps) {
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendQuickMessage = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    try {
      const res = await apiFetch('/messages', await withAuth({
        method: 'POST',
        body: JSON.stringify({
          to_id: targetUserId,
          body: message.trim()
        })
      }));

      if (res.ok) {
        setMessage('');
        setShowQuickMessage(false);
        onMessageSent?.();
        alert('Message sent successfully!');
      } else {
        const error = await res.json();
        console.error('Failed to send message:', error);
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (targetUserId === currentUserId) {
    return null; // Don't show message button for own posts
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        onClick={() => setShowQuickMessage(true)}
        style={{
          background: '#28a745',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 12
        }}
      >
        💬 Message
      </button>

      {showQuickMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 20,
            borderRadius: 8,
            width: '90%',
            maxWidth: 400,
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Send message to {targetUserName}</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              style={{
                width: '100%',
                height: 100,
                padding: 8,
                border: '1px solid #ccc',
                borderRadius: 4,
                resize: 'vertical'
              }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowQuickMessage(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={sendQuickMessage}
                disabled={!message.trim() || loading}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  opacity: (!message.trim() || loading) ? 0.5 : 1
                }}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
