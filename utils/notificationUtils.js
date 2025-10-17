// 通知システムユーティリティ
const { createClient } = require('@supabase/supabase-js');

// Supabaseクライアント（サーバーサイド用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
}

// 通知タイプ定義
const NOTIFICATION_TYPES = {
  JOB_APPLICATION: 'job_application',        // 案件への応募
  APPLICATION_APPROVED: 'application_approved', // 応募承認
  APPLICATION_REJECTED: 'application_rejected', // 応募拒否
  NEW_MESSAGE: 'new_message',               // 新着メッセージ
  JOB_COMPLETED: 'job_completed',           // 案件完了
  PAYMENT_RECEIVED: 'payment_received',     // 支払い受取
  SYSTEM_ANNOUNCEMENT: 'system_announcement' // システム通知
};

// 通知メッセージテンプレート
const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.JOB_APPLICATION]: {
    title: '新しい応募があります',
    message: '{worker_name}さんが「{job_title}」に応募しました。',
    icon: '📝',
    color: 'blue'
  },
  [NOTIFICATION_TYPES.APPLICATION_APPROVED]: {
    title: '応募が承認されました',
    message: '「{job_title}」の応募が承認されました。おめでとうございます！',
    icon: '✅',
    color: 'green'
  },
  [NOTIFICATION_TYPES.APPLICATION_REJECTED]: {
    title: '応募結果のお知らせ',
    message: '「{job_title}」の応募結果をご確認ください。',
    icon: '📋',
    color: 'orange'  
  },
  [NOTIFICATION_TYPES.NEW_MESSAGE]: {
    title: '新着メッセージ',
    message: '{sender_name}さんからメッセージが届きました。',
    icon: '💬',
    color: 'blue'
  },
  [NOTIFICATION_TYPES.JOB_COMPLETED]: {
    title: '案件完了',
    message: '「{job_title}」が完了しました。',
    icon: '🎉',
    color: 'green'
  },
  [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: {
    title: '支払い完了',
    message: '「{job_title}」の報酬 {amount}円を受け取りました。',
    icon: '💰',
    color: 'green'
  },
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: {
    title: 'システムからのお知らせ',
    message: '{message}',
    icon: '📢',
    color: 'purple'
  }
};

// 通知作成関数
async function createNotification(notificationData) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return { success: false, error: 'Database connection error' };
    }

    const {
      type,
      recipient_id,
      data = {},
      priority = 'normal'
    } = notificationData;

    // テンプレートからメッセージ生成
    const template = NOTIFICATION_TEMPLATES[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    // プレースホルダー置換
    let title = template.title;
    let message = template.message;
    
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, 'g'), data[key]);
      message = message.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    // 通知データ作成
    const notification = {
      type,
      recipient_id,
      title,
      message,
      icon: template.icon,
      color: template.color,
      priority,
      data: JSON.stringify(data),
      read_status: false,
      created_at: new Date().toISOString()
    };

    // データベースに保存
    const { data: insertedNotification, error } = await supabaseAdmin
      .from('crowdwork_notifications')
      .insert([notification])
      .select()
      .single();

    if (error) {
      console.error('Notification creation error:', error);
      return { success: false, error: error.message };
    }

    console.log('Notification created:', insertedNotification);
    return { 
      success: true, 
      notification: insertedNotification,
      message: 'Notification created successfully'
    };

  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: error.message };
  }
}

// ユーザーの通知取得
async function getUserNotifications(userId, options = {}) {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: 'Database connection error' };
    }

    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      type = null
    } = options;

    let query = supabaseAdmin
      .from('crowdwork_notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read_status', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      notifications: notifications || [],
      count: notifications?.length || 0
    };

  } catch (error) {
    console.error('Get notifications error:', error);
    return { success: false, error: error.message };
  }
}

// 未読通知数取得
async function getUnreadNotificationCount(userId) {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: 'Database connection error' };
    }

    const { data, error, count } = await supabaseAdmin
      .from('crowdwork_notifications')
      .select('id', { count: 'exact' })
      .eq('recipient_id', userId)
      .eq('read_status', false);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };

  } catch (error) {
    console.error('Get unread count error:', error);
    return { success: false, error: error.message };
  }
}

// エクスポート
module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  NOTIFICATION_TYPES
};
