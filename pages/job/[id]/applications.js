import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function JobApplications() {
  const { data: session } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && session) {
      loadData()
    }
  }, [id, session])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const jobId = parseInt(id, 10)

      // 案件情報を取得
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError) throw jobError

      // 自分の案件かチェック
      if (jobData.client_email !== session.user.email) {
        alert('この案件の応募者一覧を見る権限がありません')
        router.push('/')
        return
      }

      setJob(jobData)

      // 応募一覧を取得
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })

      if (applicationsError) throw applicationsError

      setApplications(applicationsData || [])
    } catch (error) {
      console.error('データ取得エラー:', error)
      alert('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatBudget = (budget) => {
    if (!budget) return '予算相談'
    return `¥${budget.toLocaleString()}`
  }

  const formatDate = (date) => {
    if (!date) return '期限相談'
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    const labels = {
      pending: '審査中',
      approved: '承認済み',
      rejected: '却下'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <button
            onClick={() => signIn('google')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
          >
            Googleでログイン
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* ナビゲーション */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CrowdWork
            </Link>
            <div className="flex items-center space-x-6">
              <Link href={`/job/${id}`} className="text-gray-700 hover:text-blue-600 transition-colors">← 案件詳細に戻る</Link>
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">案件一覧</Link>
              <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">プロフィール</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 案件情報 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{job?.title}</h1>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>予算: {formatBudget(job?.budget)}</span>
            <span>納期: {formatDate(job?.deadline)}</span>
          </div>
        </div>

        {/* 応募者一覧 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">応募者一覧</h2>
            <span className="text-sm text-gray-600">全 {applications.length} 件</span>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">まだ応募がありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{application.freelancer_name || '名前未設定'}</h3>
                      <p className="text-sm text-gray-500">{application.freelancer_email}</p>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">提案金額</p>
                      <p className="text-lg font-bold text-blue-600">{formatBudget(application.proposed_budget)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">希望納期</p>
                      <p className="text-lg font-semibold text-gray-800">{formatDate(application.estimated_duration)}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">提案メッセージ</p>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{application.message}</p>
                  </div>

                  <div className="text-xs text-gray-500">
                    応募日時: {new Date(application.created_at).toLocaleString('ja-JP')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
