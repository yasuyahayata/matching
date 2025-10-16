// メッセージング機能のユーティリティ関数

// メッセージデータ構造:
// {
//   id: string,           // メッセージID
//   jobId: string,        // 案件ID
//   applicationId: string, // 応募ID
//   senderId: string,     // 送信者ID (email)
//   senderName: string,   // 送信者名
//   senderType: 'client' | 'applicant', // 送信者タイプ
//   receiverId: string,   // 受信者ID (email)
//   receiverName: string, // 受信者名
//   message: string,      // メッセージ内容
//   createdAt: string,    // 送信日時
//   isRead: boolean       // 既読フラグ
// }

// メッセージデータの取得
export const getMessages = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('crowdwork_messages');
  return data ? JSON.parse(data) : [];
};

// メッセージデータの保存
export const saveMessages = (messages) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('crowdwork_messages', JSON.stringify(messages));
};

// 特定の案件・応募に関するメッセージを取得
export const getConversationMessages = (jobId, applicationId) => {
  const messages = getMessages();
  return messages.filter(msg => 
    String(msg.jobId) === String(jobId) && 
    String(msg.applicationId) === String(applicationId)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

// メッセージを送信
export const sendMessage = (messageData) => {
  const messages = getMessages();
  const newMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...messageData,
    createdAt: new Date().toISOString(),
    isRead: false
  };
  
  const updatedMessages = [...messages, newMessage];
  saveMessages(updatedMessages);
  return newMessage;
};

// メッセージを既読にする
export const markAsRead = (messageId) => {
  const messages = getMessages();
  const updatedMessages = messages.map(msg => 
    msg.id === messageId ? { ...msg, isRead: true } : msg
  );
  saveMessages(updatedMessages);
};

// 会話の未読メッセージ数を取得
export const getUnreadCount = (jobId, applicationId, currentUserId) => {
  const messages = getConversationMessages(jobId, applicationId);
  return messages.filter(msg => 
    msg.receiverId === currentUserId && !msg.isRead
  ).length;
};

// 全ての未読メッセージ数を取得
export const getTotalUnreadCount = (currentUserId) => {
  const messages = getMessages();
  return messages.filter(msg => 
    msg.receiverId === currentUserId && !msg.isRead
  ).length;
};

// 会話の参加者情報を取得
export const getConversationParticipants = (jobId, applicationId) => {
  const jobs = JSON.parse(localStorage.getItem('crowdwork_jobs') || '[]');
  const applications = JSON.parse(localStorage.getItem('crowdwork_applications') || '[]');
  
  const job = jobs.find(j => String(j.id) === String(jobId));
  const application = applications.find(app => 
    String(app.id) === String(applicationId) && String(app.jobId) === String(jobId)
  );
  
  if (!job || !application) return null;
  
  return {
    client: {
      id: job.clientId || job.clientEmail,
      name: job.clientName || 'クライアント',
      email: job.clientId || job.clientEmail
    },
    applicant: {
      id: application.applicantEmail,
      name: application.applicantName,
      email: application.applicantEmail
    },
    job: {
      id: job.id,
      title: job.title
    }
  };
};