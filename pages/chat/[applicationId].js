import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import Layout from '../../components/Layout';
import styles from '../../styles/Chat.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ChatPage() {
  const router = useRouter();
  const { applicationId } = router.query;
  const { data: session, status } = useSession();
  
  const [application, setApplication] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  // 自動スクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 応募情報を取得
  useEffect(() => {
    if (applicationId && session) {
      fetchApplication();
      fetchMessages();
    }
  }, [applicationId, session]);

  // メッセージが更新されたらスクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // リアルタイム更新の設定
  useEffect(() => {
    if (!applicationId) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            client_email
          )
        `)
        .eq('id', applicationId)
        .single();

      if (error) throw error;

      // 承認済みかチェック
      if (data.status !== 'approved') {
        setError('このチャットにアクセスできません。応募が承認されていません。');
        setLoading(false);
        return;
      }

      // 権限チェック（クライアントまたはフリーランサー本人か）
      const isClient = data.jobs.client_email === session.user.email;
      const isFreelancer = data.freelancer_email === session.user.email;

      if (!isClient && !isFreelancer) {
        setError('このチャットにアクセスする権限がありません。');
        setLoading(false);
        return;
      }

      setApplication(data);
      setLoading(false);
    } catch (err) {
      console.error('応募取得エラー:', err);
      setError('応募情報の取得に失敗しました。');
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('メッセージ取得エラー:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from('messages')
        .insert([
          {
            application_id: applicationId,
            sender_email: session.user.email,
            sender_name: session.user.name || session.user.email,
            message: newMessage.trim(),
          },
        ]);

      if (error) throw error;

      setNewMessage('');
    } catch (err) {
      console.error('メッセージ送信エラー:', err);
      alert('メッセージの送信に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <p>読み込み中...</p>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className={styles.container}>
          <p>ログインが必要です</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.container}>
          <p className={styles.error}>{error}</p>
          <button onClick={() => router.back()} className={styles.backButton}>
            戻る
          </button>
        </div>
      </Layout>
    );
  }

  if (!application) {
    return (
      <Layout>
        <div className={styles.container}>
          <p>応募が見つかりません</p>
        </div>
      </Layout>
    );
  }

  const isClient = application.jobs.client_email === session.user.email;

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← 戻る
          </button>
          <div className={styles.chatInfo}>
            <h1>💬 チャット</h1>
            <p className={styles.jobTitle}>{application.jobs.title}</p>
            <p className={styles.chatWith}>
              {isClient ? (
                <>フリーランサー: {application.freelancer_name}</>
              ) : (
                <>クライアント</>
              )}
            </p>
          </div>
        </div>

        <div className={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div className={styles.noMessages}>
              <p>まだメッセージがありません</p>
              <p>最初のメッセージを送信してみましょう！</p>
            </div>
          ) : (
            <div className={styles.messagesList}>
              {messages.map((msg) => {
                const isOwn = msg.sender_email === session.user.email;
                return (
                  <div
                    key={msg.id}
                    className={`${styles.messageItem} ${
                      isOwn ? styles.ownMessage : styles.otherMessage
                    }`}
                  >
                    <div className={styles.messageBubble}>
                      <div className={styles.messageSender}>
                        {msg.sender_name}
                      </div>
                      <div className={styles.messageText}>{msg.message}</div>
                      <div className={styles.messageTime}>
                        {new Date(msg.created_at).toLocaleString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className={styles.messageInput}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={styles.sendButton}
          >
            {sending ? '送信中...' : '送信'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
