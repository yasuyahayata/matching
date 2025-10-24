import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function createNotification({
  recipientEmail,
  senderEmail,
  senderName,
  type,
  jobId,
  jobTitle,
  applicationId,
  message
}) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_email: recipientEmail,
        sender_email: senderEmail,
        sender_name: senderName,
        type: type,
        job_id: jobId,
        job_title: jobTitle,
        application_id: applicationId,
        message: message,
        is_read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('通知作成エラー:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('通知作成エラー:', error)
    return { success: false, error }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await createNotification(req.body)
    
    if (result.success) {
      return res.status(200).json(result.data)
    } else {
      return res.status(500).json({ error: '通知の作成に失敗しました' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'サーバーエラーが発生しました' })
  }
}
