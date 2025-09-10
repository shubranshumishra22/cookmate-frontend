import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { apiFetch } from '../lib/api';

interface Message {
  id: string;
  from_id: string;
  to_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  sender?: {
    name: string;
    role: string;
  };
}

interface User {
  id: string;
  name: string;
  role: string;
  auth_id: string;
}

interface ChatProps {
  currentUser: User;
  onClose: () => void;
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

export default function Chat({ currentUser, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations (users who have messaged with current user)
  const loadConversations = async () => {
    try {
      const res = await apiFetch('/conversations', await withAuth());
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load messages between current user and selected user
  const loadMessages = async (userId: string) => {
    try {
      const res = await apiFetch(`/messages/${userId}`, await withAuth());
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || loading) return;

    setLoading(true);
    try {
      const res = await apiFetch('/messages', await withAuth({
        method: 'POST',
        body: JSON.stringify({
          to_id: selectedUser.id,
          body: newMessage.trim()
        })
      }));

      if (res.ok) {
        setNewMessage('');
        await loadMessages(selectedUser.id);
      } else {
        const error = await res.json();
        console.error('Failed to send message:', error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(from_id.eq.${currentUser.id},to_id.eq.${currentUser.id})`
        },
        () => {
          // Reload conversations and current chat when any message changes
          loadConversations();
          if (selectedUser) {
            loadMessages(selectedUser.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, selectedUser]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  return (
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
        borderRadius: 12,
        width: '90%',
        maxWidth: 800,
        height: '80%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: 16,
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8f9fa'
        }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Messages</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              padding: 4
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Conversations List */}
          <div style={{
            width: 300,
            borderRight: '1px solid #eee',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', background: '#f8f9fa' }}>
              <h3 style={{ margin: 0, fontSize: 14, color: '#666' }}>Conversations</h3>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                  No conversations yet
                </div>
              ) : (
                conversations.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    style={{
                      padding: 12,
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      background: selectedUser?.id === user.id ? '#e3f2fd' : 'white'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>
                      {user.role.toLowerCase()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding: 12,
                  borderBottom: '1px solid #eee',
                  background: '#f8f9fa'
                }}>
                  <div style={{ fontWeight: 600 }}>{selectedUser.name}</div>
                  <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>
                    {selectedUser.role.toLowerCase()}
                  </div>
                </div>

                {/* Messages */}
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        alignSelf: message.from_id === currentUser.id ? 'flex-end' : 'flex-start',
                        maxWidth: '70%'
                      }}
                    >
                      <div
                        style={{
                          background: message.from_id === currentUser.id ? '#007bff' : '#e9ecef',
                          color: message.from_id === currentUser.id ? 'white' : 'black',
                          padding: '8px 12px',
                          borderRadius: 12,
                          fontSize: 14
                        }}
                      >
                        {message.body}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: '#666',
                        marginTop: 2,
                        textAlign: message.from_id === currentUser.id ? 'right' : 'left'
                      }}>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div style={{
                  padding: 12,
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  gap: 8
                }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: 8,
                      border: '1px solid #ccc',
                      borderRadius: 20,
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                    style={{
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 20,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      opacity: (!newMessage.trim() || loading) ? 0.5 : 1
                    }}
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}>
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
