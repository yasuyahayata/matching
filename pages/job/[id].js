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
  
  const [chatRooms, setChatRooms] = useState([])
  const [loadingChats, setLoadingChats] = useState(false)

  const [hasApplied, setHasApplied] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [checkingApplication, setCheckingApplication] = useState(false)

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
        router.push('/')
      }, 1500)
    } catch (error) {
      console.error('削除エラー:', error)
      showToast(error.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

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

    if (isExpired()) {
      showToast('この案件の募集期限は終了しました', 'error')
      return
    }

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

    if (hasApplied) {
      showToast('この案件には既に応募済みです', 'info')
      setShowApplyModal(false)
      return
    }

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
        if (error.code === '23505') {
          showToast('この案件には既に応募済みです', 'info')
          setHasApplied(true)
          setShowApplyModal(false)
          return
        }
        throw error
      }

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
      }

      showToast('応募が完了しました！', 'success')
      setShowApplyModal(false)
      setApplyForm({ message: '' })
      
      setHasApplied(true)
      setApplicationStatus('pending')
      
    } catch (error) {
      console.error('応募エラー:', error)
      showToast('応募に失敗しました', 'error')
    } finally {
      setApplying(false)
    }
  }

  const handleStartChat = async () => {
    if (!session) {
      showToast('チャットするにはログインが必要です', 'info')
      signIn('google')
      return
    }

    try {
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
      
      router.push(`/chat/${chatRoom.id}`)
    } catch (error) {
      console.error('チャット開始エラー:', error)
      showToast('チャットの開始に失敗しました', 'error')
    }
  }

  const getOtherUser = (room) => {
    if (room.user1_email === session?.user?.email) {
      return { email: room.user2_email, name: room.user2_name }
    }
    return { email: room.user1_email, name: room.user1_name }
  }

  const getApplyButtonConfig = () => {
    if (!session) {
      return {
        text: '📝 この案件に応募する',
        disabled: false,
        className: 'flex-1 bg-blue-600 text-white py-4 px-8 rounded-lg hover:bg-blue-700 transition-all font-semibold text-lg'
      }
    }

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
      className: 'flex-1 bg-blue-600 text-white py-4 px-8 rounded-lg hover:bg-blue-700 transition-all font-semibold text-lg'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-xl shadow-lg max-w-md border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">案件が見つかりませんでした</h1>
          <p className="text-gray-600 mb-6">案件ID: {id}</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            トップページに戻る
          </Link>
        </div>
      </div>
    )
  }

  const isOwnJob = session?.user?.email === job.client_email
  const applyButtonConfig = getApplyButtonConfig()
  const expired = isExpired()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* メイン情報 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 mb-8">
          {/* ステータスバッジ */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className={`px-5 py-2 rounded-lg text-sm font-bold ${
                job.status === '募集中' ? 'bg-green-100 text-green-800' :
                job.status === '進行中' ? 'bg-blue-100 text-blue-800' :
                job.status === '完了' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {job.status || '募集中'}
              </span>
              {expired && (
                <span className="px-5 py-2 rounded-lg text-sm font-bold bg-red-100 text-red-800">
                  ⏰ 募集終了
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500 font-medium">投稿日: {formatCreatedAt(job.created_at)}</span>
          </div>

          {/* タイトル */}
          <h1 className="text-4xl font-bold text-gray-900 mb-6">{job.title}</h1>

          {/* 募集期限 */}
          {job.deadline && (
            <div className="mb-6">
              <span className={`text-base font-semibold ${expired ? 'text-red-600' : 'text-gray-700'}`}>
                📅 募集期限: {formatDeadline(job.deadline)}
                {expired && ' (終了)'}
              </span>
            </div>
          )}

          {/* カテゴリ */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="px-5 py-2 bg-blue-100 text-blue-700 rounded-lg text-base font-semibold">
              📂 {job.category}
            </span>
          </div>

          {/* 説明 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">案件詳細</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">{job.description}</p>
          </div>

          {/* タグ（スキル） */}
          {job.skills && job.skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">タグ</h2>
              <div className="flex flex-wrap gap-3">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          {!isOwnJob && job.status === '募集中' && (
            <div className="flex gap-4 pt-8 border-t-2 border-gray-200">
              <button
                onClick={handleApply}
                disabled={applyButtonConfig.disabled}
                className={applyButtonConfig.className}
              >
                {applyButtonConfig.text}
              </button>
              <button
                onClick={handleStartChat}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-3xl"
                title="クライアントに質問する"
              >
                💬
              </button>
            </div>
          )}

          {isOwnJob && (
            <div className="pt-8 border-t-2 border-gray-200 space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                <p className="text-blue-800 font-semibold text-base">これはあなたが投稿した案件です</p>
              </div>
              
              <div className="flex gap-4">
                <Link 
                  href={`/job/${job.id}/edit`}
                  className="flex-1 bg-yellow-500 text-white py-4 px-8 rounded-lg hover:bg-yellow-600 transition-all font-semibold text-base text-center"
                >
                  ✏️ 編集
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-4 px-8 rounded-lg hover:bg-red-700 transition-all font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? '削除中...' : '🗑️ 削除'}
                </button>
              </div>

              <div className="flex gap-4">
                <Link 
                  href={`/job/${job.id}/applications`}
                  className="flex-1 bg-green-600 text-white py-4 px-8 rounded-lg hover:bg-green-700 transition-all font-semibold text-base text-center"
                >
                  📋 応募者
                </Link>

                {/* 完了ボタン */}
                {job.status !== '完了' && (
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="flex-1 bg-gray-600 text-white py-4 px-8 rounded-lg hover:bg-gray-700 transition-all font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completing ? '処理中...' : '✓ 完了'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 投稿主のみ: メッセージ一覧 */}
        {isOwnJob && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 mb-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                💬 この案件へのメッセージ
                {chatRooms.length > 0 && (
                  <span className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-base font-semibold">
                    {chatRooms.length}件
                  </span>
                )}
              </h2>
            </div>

            {loadingChats ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-3 text-gray-600">読み込み中...</p>
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-base">まだメッセージはありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatRooms.map((room) => {
                  const otherUser = getOtherUser(room)
                  const unreadCount = room.unreadCount || 0
                  return (
                    <div
                      key={room.id}
                      onClick={() => router.push(`/chat/${room.id}`)}
                      className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {otherUser.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                                {otherUser.name}
                              </h3>
                              {unreadCount > 0 && (
                                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg min-w-[28px] text-center">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{otherUser.email}</p>
                          </div>
                        </div>
                        {room.latestMessage && (
                          <div className="ml-16">
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
                        <span className="text-blue-600 group-hover:text-blue-700 text-2xl">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">クライアント情報</h2>
          
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold overflow-hidden flex-shrink-0">
              {clientProfile?.avatar_url ? (
                <img src={clientProfile.avatar_url} alt={clientProfile.full_name} className="w-20 h-20 object-cover" />
              ) : (
                (job.client_name?.charAt(0) || 'C').toUpperCase()
              )}
            </div>
            
            <div className="flex-1">
              <Link 
                href={`/profile?email=${job.client_email}`}
                className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                {clientProfile?.full_name || job.client_name || 'クライアント'}
                <span className="text-blue-600">→</span>
              </Link>
              
              {clientProfile?.company_name && (
                <p className="text-gray-600 mb-3 text-base flex items-center">
                  <span className="mr-2">🏢</span> {clientProfile.company_name}
                </p>
              )}
              
              {clientProfile?.bio && (
                <p className="text-gray-700 mb-4 leading-relaxed">{clientProfile.bio}</p>
              )}
              
              {clientProfile?.company_website && (
                <div className="mb-4">
                  <a href={clientProfile.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-base font-medium">
                    🔗 {clientProfile.company_website}
                  </a>
                </div>
              )}

              {/* クライアントの強み表示 */}
              {clientProfile && (
                <div className="space-y-4 mt-6">
                  {clientProfile.target_industries && clientProfile.target_industries.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2 font-semibold">対象業種:</p>
                      <div className="flex flex-wrap gap-2">
                        {clientProfile.target_industries.slice(0, 3).map((industry, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                            {industry}
                          </span>
                        ))}
                        {clientProfile.target_industries.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                            +{clientProfile.target_industries.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {clientProfile.job_types && clientProfile.job_types.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2 font-semibold">職種:</p>
                      <div className="flex flex-wrap gap-2">
                        {clientProfile.job_types.slice(0, 3).map((jobType, index) => (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                            {jobType}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {clientProfile.expertise_methods && clientProfile.expertise_methods.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2 font-semibold">得意な施策:</p>
                      <div className="flex flex-wrap gap-2">
                        {clientProfile.expertise_methods.slice(0, 3).map((method, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
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
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">案件に応募する</h2>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-4xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">{job.title}</h3>
                  <p className="text-sm text-gray-600">カテゴリ: {job.category}</p>
                  {job.deadline && (
                    <p className="text-sm text-gray-600 mt-1">
                      募集期限: {formatDeadline(job.deadline)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-900 mb-3">
                    提案メッセージ・自己PR <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows="10"
                    value={applyForm.message}
                    onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base leading-relaxed"
                    placeholder="あなたの経験、スキル、この案件への提案内容を記入してください"
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-base"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="flex-1 bg-blue-600 text-white py-4 px-8 rounded-lg hover:bg-blue-700 transition-all font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
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
