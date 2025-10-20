import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function JobDetail() {
  const { data: session } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [clientProfile, setClientProfile] = useState(null)

  // 応募フォームの状態管理
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyForm, setApplyForm] = useState({
    proposed_budget: '',
    estimated_duration: '',
    message: ''
  })
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (id) {
      loadJobDetail()
    }
  }, [id])

  const loadJobDetail = async () => {
    try {
      setLoading(true)
      
      // URLから取得したidを整数に変換
      const jobId = parseInt(id, 10)
      
      console.log('案件ID（文字列）:', id)
      console.log('案件ID（整数）:', jobId)

      // 案件情報を取得
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      console.log('案件データ:', jobData)
      console.log('エラー:', jobError)

      if (jobError) {
        console.error('案件取得エラー:', jobError)
        throw jobError
      }

      setJob(jobData)

      // クライアントのプロフィールを取得
      if (jobData?.client_email) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', jobData.client_email)
          .maybeSingle()

        if (profileError) {
          console.error('プロフィール取得エラー:', profileError)
        }

        setClientProfile(profileData)
      }
    } catch (error) {
      console.error('案件詳細取得エラー:', error)
      alert('案件情報の取得に失敗しました: ' + error.message)
      setJob(null)
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

  const formatCreatedAt = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleApply = () => {
    if (!session) {
      alert('応募するにはログインが必要です')
      signIn('google')
      return
    }

    setShowApplyModal(true)
  }

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    
    if (!applyForm.proposed_budget || !applyForm.estimated_duration || !applyForm.message) {
      alert('すべての項目を入力してください')
      return
    }

    try {
      setApplying(true)

      const { data, error } = await supabase
        .from('applications')
        .insert([{
          job_id: job.id,
          freelancer_email: session.user.email,
          freelancer_name: session.user.name,
          proposed_budget: parseInt(applyForm.proposed_budget),
          estimated_duration: applyForm.estimated_duration,
          message: applyForm.message,
          status: 'pending'
        }])

      if (error) throw error

      alert('応募が完了しました！')
      setShowApplyModal(false)
      setApplyForm({ proposed_budget: '', estimated_duration: '', message: '' })
    } catch (error) {
      console.error('応募エラー:', error)
      alert('応募に失敗しました: ' + error.message)
    } finally {
      setApplying(false)
    }
  }

  const handleMessage = () => {
    if (!session) {
      alert('メッセージを送るにはログインが必要です')
      signIn('google')
      return
    }

    // Phase 10で実装予定
    alert('メッセージ機能は後のPhaseで実装します！')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
          <p className="mt-2 text-sm text-gray-500">案件ID: {id || '取得中...'}</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">案件が見つかりませんでした</h1>
          <p className="text-gray-600 mb-4">案件ID: {id}</p>
          <Link href="/" className="text-blue-600 hover:underline">トップページに戻る</Link>
        </div>
      </div>
    )
  }

  const isOwnJob = session?.user?.email === job.client_email

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
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">← 案件一覧に戻る</Link>
              {session && (
                <>
                  <Link href="/post-job" className="text-gray-700 hover:text-blue-600 transition-colors">案件投稿</Link>
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">プロフィール</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* メイン情報 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* ステータスバッジ */}
          <div className="flex items-center justify-between mb-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              job.status === '募集中' ? 'bg-green-100 text-green-800' :
              job.status === '進行中' ? 'bg-blue-100 text-blue-800' :
              job.status === '完了' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {job.status || '募集中'}
            </span>
            <span className="text-sm text-gray-500">投稿日: {formatCreatedAt(job.created_at)}</span>
          </div>

          {/* タイトル */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{job.title}</h1>

          {/* カテゴリと予算 */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium">
              📂 {job.category}
            </span>
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {formatBudget(job.budget)}
            </span>
            <span className="text-gray-600">
              📅 納期: {formatDate(job.deadline)}
            </span>
          </div>

          {/* 説明 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">案件詳細</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
          </div>

          {/* 必要なスキル */}
          {job.skills && job.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">必要なスキル</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 経験レベル */}
          {job.experience_level && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">求める経験レベル</h2>
              <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium">
                {job.experience_level}
              </span>
            </div>
          )}

          {/* アクションボタン */}
          {!isOwnJob && job.status === '募集中' && (
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleApply}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                📝 この案件に応募する
              </button>
              <button
                onClick={handleMessage}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
              >
                💬 メッセージを送る
              </button>
            </div>
          )}

          {isOwnJob && (
            <div className="pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium">これはあなたが投稿した案件です</p>
              </div>
            </div>
          )}
        </div>

        {/* クライアント情報 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">クライアント情報</h2>
          
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {clientProfile?.avatar_url ? (
                <img src={clientProfile.avatar_url} alt={clientProfile.full_name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                (job.client_name?.charAt(0) || 'C').toUpperCase()
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {clientProfile?.full_name || job.client_name || 'クライアント'}
              </h3>
              
              {clientProfile?.location && (
                <p className="text-gray-600 mb-2">📍 {clientProfile.location}</p>
              )}
              
              {clientProfile?.bio && (
                <p className="text-gray-700 mb-3">{clientProfile.bio}</p>
              )}
              
              {clientProfile?.skills && clientProfile.skills.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">スキル:</p>
                  <div className="flex flex-wrap gap-2">
                    {clientProfile.skills.slice(0, 5).map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 応募モーダル */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">案件に応募する</h2>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-6">
                {/* 案件情報の表示 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{job.title}</h3>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>予算: {formatBudget(job.budget)}</span>
                    <span>納期: {formatDate(job.deadline)}</span>
                  </div>
                </div>

                {/* 提案金額 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提案金額 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={applyForm.proposed_budget}
                      onChange={(e) => setApplyForm({ ...applyForm, proposed_budget: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="50000"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">クライアントの予算: {formatBudget(job.budget)}</p>
                </div>

                {/* 希望納期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    希望納期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={applyForm.estimated_duration}
                    onChange={(e) => setApplyForm({ ...applyForm, estimated_duration: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500">クライアントの希望納期: {formatDate(job.deadline)}</p>
                </div>

                {/* 提案メッセージ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提案メッセージ・自己PR <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows="6"
                    value={applyForm.message}
                    onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="あなたの経験、スキル、この案件への提案内容を記入してください"
                  ></textarea>
                </div>

                {/* ボタン */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {applying ? '送信中...' : '応募する'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
