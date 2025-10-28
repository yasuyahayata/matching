import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ToastManager'

export default function JobDetail() {
  const { data: session } = useSession()
  const router = useRouter()
  const { id } = router.query
  const { showToast } = useToast()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [clientProfile, setClientProfile] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // 💬 新機能: メッセージ一覧
  const [chatRooms, setChatRooms] = useState([])
  const [loadingChats, setLoadingChats] = useState(false)

  // 🆕 応募状態の管理
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [checkingApplication, setCheckingApplication] = useState(false)

  // 応募フォームの状態管理
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyForm, setApplyForm] = useState({
    message: ''
  })
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (id) {
      loadJobDetail()
    }
  }, [id, session])

  // 🆕 応募状態をチェック
  useEffect(() => {
    if (id && session && !checkingApplication) {
      checkApplicationStatus()
    }
  }, [id, session])

  const loadJobDetail = async () => {
    try {
      setLoading(true)
      
      const jobId = parseInt(id, 10)

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError) {
        console.error('案件取得エラー:', jobError)
        throw jobError
      }

      setJob(jobData)

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

      // 💬 投稿主の場合、チャットルーム一覧を取得
      if (session?.user?.email === jobData?.client_email) {
        loadChatRooms(jobId)
      }
    } catch (error) {
      console.error('案件詳細取得エラー:', error)
      showToast('案件情報の取得に失敗しました', 'error')
      setJob(null)
    } finally {
      setLoading(false)
    }
  }

  // 🆕 応募状態をチェック
  const checkApplicationStatus = async () => {
    try {
      setCheckingApplication(true)
      const res = await fetch(`/api/jobs/${id}/check-application`)
      
      if (res.ok) {
        const data = await res.json()
        setHasApplied(data.hasApplied)
        setApplicationStatus(data.application?.status || null)
      }
    } catch (error) {
      console.error('応募状態チェックエラー:', error)
    } finally {
      setCheckingApplication(false)
    }
  }

  // 💬 新機能: チャットルーム一覧を取得
  const loadChatRooms = async (jobId) => {
    try {
      setLoadingChats(true)
      const res = await fetch(`/api/jobs/${jobId}/chat-rooms`)
      
      if (!res.ok) {
        throw new Error('チャットルームの取得に失敗しました')
      }

      const data = await res.json()
      setChatRooms(data)
    } catch (error) {
      console.error('チャットルーム取得エラー:', error)
    } finally {
      setLoadingChats(false)
    }
  }

  // 🆕 案件を完了にする
  const handleComplete = async () => {
    try {
      setCompleting(true)

      const res = await fetch(`/api/jobs/${id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '完了処理に失敗しました')
      }

      showToast('案件を完了にしました！', 'success')
      setTimeout(() => {
        router.push('/profile')
      }, 1000)
    } catch (error) {
      console.error('完了処理エラー:', error)
      showToast(error.message, 'error')
    } finally {
      setCompleting(false)
    }
  }

  // 🆕 案件を削除
  const handleDelete = async () => {
    try {
      setDeleting(true)

      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.hasApplications) {
          showToast('応募がある案件は削除できません', 'error')
        } else {
          throw new Error(data.error || '削除に失敗しました')
        }
        return
      }

      showToast('案件を削除しました', 'success')
      setTimeout(() => {
        router.push('/profile')
      }, 1000)
    } catch (error) {
      console.error('削除エラー:', error)
      showToast(error.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  // 🆕 期限が過ぎているかチェック
  const isExpired = () => {
    if (!job?.deadline) return false
    return new Date(job.deadline) < new Date()
  }

  const formatCreatedAt = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 🆕 期限のフォーマット
  const formatDeadline = (date) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatMessageTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleApply = () => {
    if (!session) {
      showToast('応募するにはログインが必要です', 'info')
      signIn('google')
      return
    }

    // 🆕 期限チェック
    if (isExpired()) {
      showToast('この案件の募集期限は終了しました', 'error')
      return
    }

    // 🆕 既に応募済みの場合
    if (hasApplied) {
      showToast('この案件には既に応募済みです', 'info')
      return
    }

    setShowApplyModal(true)
  }

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    
    if (!applyForm.message) {
      showToast('メッセージを入力してください', 'error')
      return
    }

    // 🆕 二重応募チェック
    if (hasApplied) {
      showToast('この案件には既に応募済みです', 'info')
      setShowApplyModal(false)
      return
    }

    // 🆕 期限チェック
    if (isExpired()) {
      showToast('この案件の募集期限は終了しました', 'error')
      setShowApplyModal(false)
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
          message: applyForm.message,
          status: 'pending'
        }])
        .select()

      if (error) {
        // 🆕 ユニーク制約エラーの場合
        if (error.code === '23505') {
          showToast('この案件には既に応募済みです', 'info')
          setHasApplied(true)
          setShowApplyModal(false)
          return
        }
        throw error
      }

      // 🆕 投稿者に通知を送信
      try {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientEmail: job.client_email,
            senderEmail: session.user.email,
            senderName: session.user.name,
            type: 'new_application',
            jobId: job.id.toString(),
            jobTitle: job.title,
            applicationId: data[0].id,
            message: `「${job.title}」に新しい応募がありました。`
          })
        })
      } catch (notifError) {
        console.error('通知送信エラー:', notifError)
        // 通知エラーでも応募は成功とする
      }

      showToast('応募が完了しました！', 'success')
      setShowApplyModal(false)
      setApplyForm({ message: '' })
      
      // 🆕 応募状態を更新
      setHasApplied(true)
      setApplicationStatus('pending')
      
    } catch (error) {
      console.error('応募エラー:', error)
      showToast('応募に失敗しました', 'error')
    } finally {
      setApplying(false)
    }
  }

  // 💬 新機能: チャット開始
  const handleStartChat = async () => {
    if (!session) {
      showToast('チャットするにはログインが必要です', 'info')
      signIn('google')
      return
    }

    try {
      // チャットルームを作成または取得
      const res = await fetch('/api/chat-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otherUserEmail: job.client_email,
          otherUserName: job.client_name || clientProfile?.full_name || 'クライアント',
          jobId: job.id
        }),
      })

      if (!res.ok) {
        throw new Error('チャットルームの作成に失敗しました')
      }

      const chatRoom = await res.json()
      
      // チャットページに遷移
      router.push(`/chat/${chatRoom.id}`)
    } catch (error) {
      console.error('チャット開始エラー:', error)
      showToast('チャットの開始に失敗しました', 'error')
    }
  }

  // 💬 新機能: 相手のユーザー情報を取得
  const getOtherUser = (room) => {
    if (room.user1_email === session?.user?.email) {
      return { email: room.user2_email, name: room.user2_name }
    }
    return { email: room.user1_email, name: room.user1_name }
  }

  // 🆕 応募ボタンのテキストとスタイルを取得
  const getApplyButtonConfig = () => {
    if (!session) {
      return {
        text: '📝 この案件に応募する',
        disabled: false,
        className: 'flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg'
      }
    }

    // 🆕 期限切れチェック
    if (isExpired()) {
      return {
        text: '⏰ 募集期限が終了しました',
        disabled: true,
        className: 'flex-1 bg-gray-400 text-white py-4 px-8 rounded-lg font-semibold text-lg cursor-not-allowed'
      }
    }

    if (hasApplied) {
      const statusText = {
        'pending': '✓ 応募済み（審査中）',
        'approved': '✓ 承認されました',
        'rejected': '× 不承認'
      }[applicationStatus] || '✓ 応募済み'

      return {
        text: statusText,
        disabled: true,
        className: 'flex-1 bg-gray-400 text-white py-4 px-8 rounded-lg font-semibold text-lg cursor-not-allowed'
      }
    }

    return {
      text: '📝 この案件に応募する',
      disabled: false,
      className: 'flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">案件が見つかりませんでした</h1>
          <p className="text-gray-600 mb-4">案件ID: {id}</p>
          <Link href="/" className="text-blue-600 hover:underline">トップページに戻る</Link>
        </div>
      </div>
    )
  }

  const isOwnJob = session?.user?.email === job.client_email
  const applyButtonConfig = getApplyButtonConfig()
  const expired = isExpired()

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* メイン情報 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* ステータスバッジ */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                job.status === '募集中' ? 'bg-green-100 text-green-800' :
                job.status === '進行中' ? 'bg-blue-100 text-blue-800' :
                job.status === '完了' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {job.status || '募集中'}
              </span>
              {/* 🆕 期限切れバッジ */}
              {expired && (
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  ⏰ 募集終了
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">投稿日: {formatCreatedAt(job.created_at)}</span>
          </div>

          {/* タイトル */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{job.title}</h1>

          {/* 🆕 募集期限 */}
          {job.deadline && (
            <div className="mb-4">
              <span className={`text-sm font-medium ${expired ? 'text-red-600' : 'text-gray-700'}`}>
                📅 募集期限: {formatDeadline(job.deadline)}
                {expired && ' (終了)'}
              </span>
            </div>
          )}

          {/* カテゴリ */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium">
              📂 {job.category}
            </span>
          </div>

          {/* 説明 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">案件詳細</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
          </div>

          {/* タグ（スキル） */}
          {job.skills && job.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">タグ</h2>
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

          {/* アクションボタン */}
          {!isOwnJob && job.status === '募集中' && (
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleApply}
                disabled={applyButtonConfig.disabled}
                className={applyButtonConfig.className}
              >
                {applyButtonConfig.text}
              </button>
              <button
                onClick={handleStartChat}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-2xl"
                title="クライアントに質問する"
              >
                💬
              </button>
            </div>
          )}

          {isOwnJob && (
            <div className="pt-6 border-t border-gray-200 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium">これはあなたが投稿した案件です</p>
              </div>
              
              {/* 🆕 編集・削除ボタン */}
              <div className="flex gap-3">
                <Link 
                  href={`/job/${job.id}/edit`}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 px-8 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl font-semibold text-lg text-center"
                >
                  ✏️ 編集する
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-8 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? '削除中...' : '🗑️ 削除する'}
                </button>
              </div>

              <div className="flex gap-3">
                <Link 
                  href={`/job/${job.id}/applications`}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-8 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg text-center"
                >
                  📋 応募者一覧を見る
                </Link>
                {/* 🆕 完了ボタン */}
                {job.status !== '完了' && (
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-8 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completing ? '処理中...' : '✓ 完了にする'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 💬 投稿主のみ: メッセージ一覧 */}
        {isOwnJob && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                💬 この案件へのメッセージ
                {chatRooms.length > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {chatRooms.length}件
                  </span>
                )}
              </h2>
            </div>

            {loadingChats ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600">読み込み中...</p>
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">💬</p>
                <p>まだメッセージはありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatRooms.map((room) => {
                  const otherUser = getOtherUser(room)
                  const unreadCount = room.unreadCount || 0
                  return (
                    <div
                      key={room.id}
                      onClick={() => router.push(`/chat/${room.id}`)}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {otherUser.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                {otherUser.name}
                              </h3>
                              {unreadCount > 0 && (
                                <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[24px] text-center">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{otherUser.email}</p>
                          </div>
                        </div>
                        {room.latestMessage && (
                          <div className="ml-13">
                            <p className="text-gray-700 text-sm line-clamp-2">
                              {room.latestMessage.message}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {room.latestMessage && (
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(room.latestMessage.created_at)}
                          </span>
                        )}
                        <span className="text-blue-600 group-hover:text-blue-700 text-xl">
                          →
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* クライアント情報 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">クライアント情報</h2>
          
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
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
              
              {clientProfile?.company_name && (
                <p className="text-gray-600 mb-2">🏢 {clientProfile.company_name}</p>
              )}
              
              {clientProfile?.bio && (
                <p className="text-gray-700 mb-3">{clientProfile.bio}</p>
              )}
              
              {clientProfile?.company_website && (
                <div className="mb-3">
                  <a href={clientProfile.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    🔗 {clientProfile.company_website}
                  </a>
                </div>
              )}

              {/* クライアントの強み表示 */}
              {clientProfile && (
                <div className="space-y-3 mt-4">
                  {clientProfile.target_industries && clientProfile.target_industries.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">対象業種:</p>
                      <div className="flex flex-wrap gap-1">
                        {clientProfile.target_industries.slice(0, 3).map((industry, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {industry}
                          </span>
                        ))}
                        {clientProfile.target_industries.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{clientProfile.target_industries.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {clientProfile.job_types && clientProfile.job_types.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">職種:</p>
                      <div className="flex flex-wrap gap-1">
                        {clientProfile.job_types.slice(0, 3).map((jobType, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {jobType}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {clientProfile.expertise_methods && clientProfile.expertise_methods.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">得意な施策:</p>
                      <div className="flex flex-wrap gap-1">
                        {clientProfile.expertise_methods.slice(0, 3).map((method, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{job.title}</h3>
                  <p className="text-sm text-gray-600">カテゴリ: {job.category}</p>
                  {job.deadline && (
                    <p className="text-sm text-gray-600 mt-1">
                      募集期限: {formatDeadline(job.deadline)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提案メッセージ・自己PR <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows="8"
                    value={applyForm.message}
                    onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="あなたの経験、スキル、この案件への提案内容を記入してください"
                  ></textarea>
                </div>

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
    </>
  )
}
