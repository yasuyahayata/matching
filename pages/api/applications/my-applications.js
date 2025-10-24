import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: '認証が必要です' })
  }

  if (req.method === 'GET') {
    try {
      // 1. 自分が応募した案件を取得
      const { data: myApplications, error: error1 } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            id,
            title,
            client_email,
            client_name
          )
        `)
        .eq('freelancer_email', session.user.email)

      if (error1) {
        console.error('自分の応募取得エラー:', error1)
        throw error1
      }

      // 2. 自分の案件に応募された案件を取得
      const { data: receivedApplications, error: error2 } = await supabase
        .from('applications')
        .select(`
          *,
          jobs!inner (
            id,
            title,
            client_email,
            client_name
          )
        `)
        .eq('jobs.client_email', session.user.email)

      if (error2) {
        console.error('受け取った応募取得エラー:', error2)
        throw error2
      }

      // 両方を結合
      const allApplications = [
        ...(myApplications || []),
        ...(receivedApplications || [])
      ]

      console.log('自分の応募:', myApplications?.length || 0)
      console.log('受け取った応募:', receivedApplications?.length || 0)
      console.log('合計:', allApplications.length)

      return res.status(200).json(allApplications)
    } catch (error) {
      console.error('応募取得エラー:', error)
      return res.status(500).json({ error: '応募情報の取得に失敗しました' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
