import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/ToastManager'

// タグカテゴリーの定義（プロフィール用）
const tagCategories = {
  '対象業種': [
    'EC・小売',
    'エンタメ・メディア',
    '飲食・サービス',
    'IT・テクノロジー',
    '美容・ファッション',
    '教育・スクール',
    '金融・保険',
    '不動産',
    '医療・ヘルスケア',
    '製造業',
    'コンサルティング',
    '人材・採用',
    '旅行・観光',
    'その他'
  ],
  '職種': [
    'マーケティング担当',
    'プロダクトマネージャー',
    'セールス・営業',
    'カスタマーサクセス',
    'カスタマーサポート',
    'ブランドマネージャー',
    '広報・PR',
    'SNS運用',
    'コンテンツディレクター',
    'コミュニティマネージャー',
    'データアナリスト',
    'プロジェクトマネージャー',
    'エンジニア',
    'デザイナー',
    '編集者・ライター',
    'その他'
  ],
  '解決できる課題': [
    '新規顧客獲得',
    'リピート率向上',
    'ブランディング強化',
    'エンゲージメント向上',
    'LTV向上',
    '口コミ促進'
  ],
  '得意な施策・手法': [
    'コミュニティ運営',
    'SNSマーケティング',
    'イベント企画',
    'ロイヤリティプログラム',
    'UGC活用',
    'インフルエンサー連携'
  ],
  'スキル・専門分野': [
    'プログラミング',
    'デザイン',
    '動画・映像',
    'ライティング',
    'マーケティング',
    'データ分析',
    'プロジェクト管理'
  ]
};

// スキル・専門分野の詳細
const skillDetails = {
  'プログラミング': [
    'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular',
    'Python', 'Java', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
    'Node.js', 'Next.js', 'Nuxt.js', 'Django', 'Laravel'
  ],
  'デザイン': [
    'Illustrator', 'Photoshop', 'Figma', 'Adobe XD', 'Sketch',
    'InDesign', 'After Effects', 'Canva', 'UI/UXデザイン',
    'グラフィックデザイン', 'ロゴデザイン', 'Webデザイン'
  ],
  '動画・映像': [
    'Premiere Pro', 'After Effects', 'Final Cut Pro', 'DaVinci Resolve',
    '動画編集', 'モーショングラフィックス', 'アニメーション',
    'YouTube編集', 'TikTok編集', '撮影', '字幕作成'
  ],
  'ライティング': [
    'SEOライティング', 'コピーライティング', 'セールスライティング',
    'コンテンツライティング', '技術文書作成', '翻訳（英日）',
    '翻訳（日英）', '校正', '編集', 'ブログ執筆'
  ],
  'マーケティング': [
    'Google Analytics', 'SEO', 'SEM', 'SNS運用',
    'Facebook広告', 'Google広告', 'Instagram運用', 'Twitter運用',
    'コンテンツマーケティング', 'メールマーケティング', 'アフィリエイト'
  ],
  'データ分析': [
    'Excel', 'Google Sheets', 'SQL', 'Python（分析）',
    'Tableau', 'Power BI', 'Google Data Studio',
    'R言語', 'データビジュアライゼーション'
  ],
  'プロジェクト管理': [
    'Notion', 'Slack', 'Trello', 'Asana', 'Jira',
    'Backlog', 'Monday.com', 'アジャイル', 'スクラム'
  ]
};

export default function Profile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { email } = router.query
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    bio: '',
    company_website: '',
    company_name: '',
    target_industries: [],
    job_types: [],
    interested_challenges: [],
    expertise_methods: [],
    skills: [],
    avatar_url: ''
  })

  const [selectedSkillCategory, setSelectedSkillCategory] = useState(null)
  const [postedJobs, setPostedJobs] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [unreadApplicationNotifications, setUnreadApplicationNotifications] = useState(0)
  const [jobApplications, setJobApplications] = useState({})
  const [expandedJobId, setExpandedJobId] = useState(null)
  const [processingApplicationId, setProcessingApplicationId] = useState(null)
  const [unreadNewApplications, setUnreadNewApplications] = useState(0)
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0
  })

  useEffect(() => {
    if (session) {
      const targetEmail = email || session.user.email
      const isOwn = !email || email === session.user.email
      
      setIsOwnProfile(isOwn)
      loadProfile(targetEmail)
      loadPostedJobs(targetEmail)
      
      if (isOwn) {
        loadMyApplications()
        loadUnreadApplicationNotifications()
        loadUnreadNewApplications()
      }
    }
  }, [session, email])

  useEffect(() => {
    if (isOwnProfile && postedJobs.length > 0) {
      loadAllApplications()
    }
  }, [postedJobs, isOwnProfile])

  useEffect(() => {
    if (activeTab === 'my-applications' && isOwnProfile) {
      markApplicationNotificationsAsRead()
    }
  }, [activeTab, isOwnProfile])

  useEffect(() => {
    if (activeTab === 'posted-jobs' && isOwnProfile) {
      markNewApplicationNotificationsAsRead()
    }
  }, [activeTab, isOwnProfile])

  const loadApplicationsForJob = async (jobId) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/applications`)
      if (!res.ok) throw new Error('応募の取得に失敗しました')
      
      const data = await res.json()
      setJobApplications(prev => ({
        ...prev,
        [jobId]: data
      }))
    } catch (error) {
      console.error('応募取得エラー:', error)
    }
  }

  const loadAllApplications = async () => {
    for (const job of postedJobs) {
      await loadApplicationsForJob(job.id)
    }
  }

  const handleApplicationStatusUpdate = async (applicationId, newStatus, jobId) => {
    try {
      setProcessingApplicationId(applicationId)
      
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'ステータスの更新に失敗しました')
      }

      showToast(newStatus === 'approved' ? '応募を承認しました！' : '応募を却下しました', newStatus === 'approved' ? 'success' : 'info')
      
      await loadApplicationsForJob(jobId)
      
    } catch (err) {
      console.error('ステータス更新エラー:', err)
      showToast(err.message, 'error')
    } finally {
      setProcessingApplicationId(null)
    }
  }

  const loadMyApplications = async () => {
    try {
      const res = await fetch('/api/applications/my-applications')
      if (!res.ok) throw new Error('応募の取得に失敗しました')
      
      const data = await res.json()
      const myApps = data.filter(app => app.freelancer_email === session.user.email)
      setMyApplications(myApps)
    } catch (error) {
      console.error('応募取得エラー:', error)
    }
  }

  const loadUnreadApplicationNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('通知の取得に失敗しました')
      
      const notifications = await res.json()
      const unreadCount = notifications.filter(notif => 
        !notif.is_read && 
        (notif.type === 'application_approved' || notif.type === 'application_rejected')
      ).length
      
      setUnreadApplicationNotifications(unreadCount)
    } catch (error) {
      console.error('通知取得エラー:', error)
    }
  }

  const loadUnreadNewApplications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('通知の取得に失敗しました')
      
      const notifications = await res.json()
      const unreadCount = notifications.filter(notif => 
        !notif.is_read && notif.type === 'new_application'
      ).length
      
      setUnreadNewApplications(unreadCount)
    } catch (error) {
      console.error('応募通知取得エラー:', error)
    }
  }

  const markApplicationNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'application_approved'
        })
      })
      
      await fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'application_rejected'
        })
      })
      
      console.log('応募通知を既読にしました')
      
      await loadUnreadApplicationNotifications()
      window.dispatchEvent(new Event('messagesRead'))
    } catch (error) {
      console.error('通知既読エラー:', error)
    }
  }

  const markNewApplicationNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'new_application'
        })
      })
      
      console.log('新規応募通知を既読にしました')
      
      await loadUnreadNewApplications()
      window.dispatchEvent(new Event('messagesRead'))
    } catch (error) {
      console.error('通知既読エラー:', error)
    }
  }

  const getUserNameFromChatRooms = async (email) => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('user1_email, user1_name, user2_email, user2_name')
        .or(`user1_email.eq.${email},user2_email.eq.${email}`)
        .limit(1)
        .maybeSingle()

      if (error || !data) return null

      if (data.user1_email === email) {
        return data.user1_name
      } else if (data.user2_email === email) {
        return data.user2_name
      }
      
      return null
    } catch (error) {
      console.error('名前取得エラー:', error)
      return null
    }
  }

  const loadProfile = async (targetEmail) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', targetEmail)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('プロフィール読み込みエラー:', error)
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          bio: data.bio || '',
          company_website: data.company_website || '',
          company_name: data.company_name || '',
          target_industries: data.target_industries || [],
          job_types: data.job_types || [],
          interested_challenges: data.interested_challenges || [],
          expertise_methods: data.expertise_methods || [],
          skills: data.skills || [],
          avatar_url: data.avatar_url || ''
        })
      } else {
        const userName = await getUserNameFromChatRooms(targetEmail)
        
        setProfile({
          full_name: userName || '',
          email: targetEmail,
          bio: '',
          company_website: '',
          company_name: '',
          target_industries: [],
          job_types: [],
          interested_challenges: [],
          expertise_methods: [],
          skills: [],
          avatar_url: ''
        })
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPostedJobs = async (targetEmail) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_email', targetEmail)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPostedJobs(data || [])
      
      const total = data?.length || 0
      const active = data?.filter(job => job.status === '募集中').length || 0
      const completed = data?.filter(job => job.status === '完了').length || 0
      
      setStats({
        totalJobs: total,
        activeJobs: active,
        completedJobs: completed
      })
    } catch (error) {
      console.error('案件読み込みエラー:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addTag = (category, tag) => {
    const fieldMap = {
      '対象業種': 'target_industries',
      '職種': 'job_types',
      '解決できる課題': 'interested_challenges',
      '得意な施策・手法': 'expertise_methods',
      'スキル・専門分野': 'skills'
    }
    
    const field = fieldMap[category]
    if (!profile[field].includes(tag)) {
      setProfile(prev => ({
        ...prev,
        [field]: [...prev[field], tag]
      }))
    }
  }

  const removeTag = (category, tag) => {
    const fieldMap = {
      '対象業種': 'target_industries',
      '職種': 'job_types',
      '解決できる課題': 'interested_challenges',
      '得意な施策・手法': 'expertise_methods',
      'スキル・専門分野': 'skills'
    }
    
    const field = fieldMap[category]
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter(t => t !== tag)
    }))
  }

  const handleSkillDetailClick = (skill) => {
    if (profile.skills.includes(skill)) {
      setProfile(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s !== skill)
      }))
    } else {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    }
  }

  const handleSave = async () => {
    if (!isOwnProfile) {
      showToast('他のユーザーのプロフィールは編集できません', 'error')
      return
    }

    try {
      setSaving(true)

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', session.user.email)
        .maybeSingle()

      if (fetchError) {
        console.error('プロフィール確認エラー:', fetchError)
        throw fetchError
      }

      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: profile.full_name,
            bio: profile.bio,
            company_website: profile.company_website,
            company_name: profile.company_name,
            target_industries: profile.target_industries,
            job_types: profile.job_types,
            interested_challenges: profile.interested_challenges,
            expertise_methods: profile.expertise_methods,
            skills: profile.skills,
            updated_at: new Date().toISOString()
          })
          .eq('email', session.user.email)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([
            {
              email: profile.email,
              full_name: profile.full_name,
              bio: profile.bio,
              company_website: profile.company_website,
              company_name: profile.company_name,
              target_industries: profile.target_industries,
              job_types: profile.job_types,
              interested_challenges: profile.interested_challenges,
              expertise_methods: profile.expertise_methods,
              skills: profile.skills,
              avatar_url: session.user.image || ''
            }
          ])

        if (error) throw error
      }

      showToast('プロフィールを保存しました！', 'success')
      await loadProfile(session.user.email)
      setActiveTab('overview')
    } catch (error) {
      console.error('保存エラー:', error)
      showToast('プロフィールの保存に失敗しました: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: '審査中', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '承認済み', className: 'bg-green-100 text-green-800' },
      rejected: { label: '却下', className: 'bg-red-100 text-red-800' }
    }
    
    return config[status] || config.pending
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-xl shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-6">プロフィールを見るにはログインしてください。</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            トップページへ
          </Link>
        </div>
      </div>
    )
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* プロフィールヘッダー */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 mb-8">
          <div className="flex items-start space-x-8">
            <div className="w-32 h-32 bg-blue-600 rounded-xl flex items-center justify-center text-white text-4xl font-bold overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-32 h-32 object-cover" />
              ) : (
                (profile.full_name.charAt(0) || 'U').toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {profile.full_name || 'ユーザー'}
                {!isOwnProfile && <span className="text-lg text-gray-500 ml-3 font-normal">(他のユーザー)</span>}
              </h1>
              <p className="text-gray-600 mb-2 text-lg">{profile.email}</p>
              {profile.company_name && (
                <p className="text-gray-700 mb-3 text-lg flex items-center">
                  <span className="mr-2">🏢</span> {profile.company_name}
                </p>
              )}
              {profile.bio && (
                <p className="text-gray-700 leading-relaxed mt-4">{profile.bio}</p>
              )}
              {!profile.bio && isOwnProfile && (
                <p className="text-gray-400 italic mt-4">プロフィールを設定してください</p>
              )}
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-12 px-10">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-6 px-2 border-b-2 font-semibold text-base whitespace-nowrap transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 概要
              </button>
              <button
                onClick={() => setActiveTab('posted-jobs')}
                className={`py-6 px-2 border-b-2 font-semibold text-base whitespace-nowrap transition-colors relative ${
                  activeTab === 'posted-jobs'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📝 投稿した案件
                {isOwnProfile && unreadNewApplications > 0 && (
                  <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {unreadNewApplications}
                  </span>
                )}
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('my-applications')}
                  className={`py-6 px-2 border-b-2 font-semibold text-base whitespace-nowrap transition-colors relative ${
                    activeTab === 'my-applications'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📋 応募した案件
                  {unreadApplicationNotifications > 0 && (
                    <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {unreadApplicationNotifications}
                    </span>
                  )}
                </button>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`py-6 px-2 border-b-2 font-semibold text-base whitespace-nowrap transition-colors ${
                    activeTab === 'edit'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ✏️ プロフィール編集
                </button>
              )}
            </nav>
          </div>
          <div className="p-10">
            {/* 概要タブ */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 border-2 border-blue-200 p-8 rounded-xl">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2 uppercase tracking-wide">総投稿数</h3>
                    <p className="text-4xl font-bold text-blue-600">{stats.totalJobs}</p>
                  </div>
                  <div className="bg-green-50 border-2 border-green-200 p-8 rounded-xl">
                    <h3 className="text-sm font-semibold text-green-900 mb-2 uppercase tracking-wide">募集中</h3>
                    <p className="text-4xl font-bold text-green-600">{stats.activeJobs}</p>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-200 p-8 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">完了</h3>
                    <p className="text-4xl font-bold text-gray-600">{stats.completedJobs}</p>
                  </div>
                </div>

                {/* 強み・提供できる価値セクション */}
                <div className="bg-blue-50 border-2 border-blue-200 p-8 rounded-xl">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                    💪 強み・提供できる価値
                  </h2>

                  {/* タグ表示 */}
                  {Object.entries({
                    '対象業種': profile.target_industries,
                    '職種': profile.job_types,
                    '解決できる課題': profile.interested_challenges,
                    '得意な施策・手法': profile.expertise_methods,
                    'スキル・専門分野': profile.skills
                  }).map(([label, tags]) => (
                    tags && tags.length > 0 && (
                      <div key={label} className="mb-6 last:mb-0">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">{label}</h3>
                        <div className="flex flex-wrap gap-3">
                          {tags.map((tag, index) => (
                            <span key={index} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  ))}

                  {/* 何も設定されていない場合 */}
                  {profile.target_industries.length === 0 && 
                   profile.job_types.length === 0 && 
                   profile.interested_challenges.length === 0 && 
                   profile.expertise_methods.length === 0 && 
                   profile.skills.length === 0 && (
                    <p className="text-gray-500 text-center py-12">
                      {isOwnProfile ? 'プロフィール編集から強みを設定してください' : 'まだ強みが設定されていません'}
                    </p>
                  )}
                </div>

                {profile.company_website && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">会社ホームページ・SNS</h3>
                    <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                      <a href={profile.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                        {profile.company_website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 投稿した案件タブ */}
            {activeTab === 'posted-jobs' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">投稿した案件 ({postedJobs.length}件)</h3>
                  {isOwnProfile && (
                    <Link
                      href="/post-job"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      + 新しい案件を投稿
                    </Link>
                  )}
                </div>

                {postedJobs.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-gray-400 text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      {isOwnProfile ? 'まだ案件を投稿していません' : 'まだ案件がありません'}
                    </h3>
                    {isOwnProfile && (
                      <>
                        <p className="text-gray-500 mb-6">最初の案件を投稿してみましょう</p>
                        <Link
                          href="/post-job"
                          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          案件を投稿する
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {postedJobs.map((job) => {
                      const applications = jobApplications[job.id] || []
                      const pendingCount = applications.filter(app => app.status === 'pending').length
                      const isExpanded = expandedJobId === job.id
                      
                      return (
                        <div key={job.id} className="border-2 border-gray-200 rounded-xl p-8 hover:border-blue-300 hover:shadow-md transition-all bg-white">
                          {/* 案件ヘッダー */}
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-3">
                                <h4 className="text-xl font-bold text-gray-900">{job.title}</h4>
                                <span className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
                                  job.status === '募集中' ? 'bg-green-100 text-green-800' :
                                  job.status === '進行中' ? 'bg-blue-100 text-blue-800' :
                                  job.status === '完了' ? 'bg-gray-100 text-gray-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {job.status || '募集中'}
                                </span>
                                {isOwnProfile && pendingCount > 0 && (
                                  <span className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold">
                                    新着応募 {pendingCount}件
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">{job.description}</p>
                              {job.skills && job.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {job.skills.slice(0, 5).map((skill, index) => (
                                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                                      {skill}
                                    </span>
                                  ))}
                                  {job.skills.length > 5 && (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                                      +{job.skills.length - 5}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 応募者リスト（展開時） */}
                          {isOwnProfile && isExpanded && applications.length > 0 && (
                            <div className="mt-6 border-t-2 border-gray-200 pt-6">
                              <h5 className="text-lg font-bold text-gray-900 mb-4">
                                応募者一覧 ({applications.length}件)
                              </h5>
                              <div className="space-y-4">
                                {applications.map((app) => {
                                  const statusConfig = getStatusBadge(app.status)
                                  
                                  return (
                                    <div key={app.id} className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                                      <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-gray-900 text-lg">
                                              {app.freelancer_name}
                                            </span>
                                            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${statusConfig.className}`}>
                                              {statusConfig.label}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-600 mb-3">{app.freelancer_email}</p>
                                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">応募メッセージ:</p>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                              {app.message}
                                            </p>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-3">
                                            応募日時: {new Date(app.created_at).toLocaleString('ja-JP')}
                                          </p>
                                        </div>
                                      </div>

                                      {/* 承認・却下ボタン */}
                                      {app.status === 'pending' && (
                                        <div className="flex gap-3 mt-4">
                                          <button
                                            onClick={() => handleApplicationStatusUpdate(app.id, 'approved', job.id)}
                                            disabled={processingApplicationId === app.id}
                                            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all text-sm font-semibold disabled:opacity-50"
                                          >
                                            {processingApplicationId === app.id ? '処理中...' : '✓ 承認'}
                                          </button>
                                          <button
                                            onClick={() => handleApplicationStatusUpdate(app.id, 'rejected', job.id)}
                                            disabled={processingApplicationId === app.id}
                                            className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all text-sm font-semibold disabled:opacity-50"
                                          >
                                            {processingApplicationId === app.id ? '処理中...' : '✗ 却下'}
                                          </button>
                                        </div>
                                      )}

                                      {/* 承認後のチャットボタン */}
                                      {app.status === 'approved' && app.chat_room_id && (
                                        <Link
                                          href={`/chat/${app.chat_room_id}`}
                                          className="block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold text-center"
                                        >
                                          💬 チャットを開く
                                        </Link>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* ボタン群 */}
                          <div className="flex space-x-3 mt-6">
                            <Link
                              href={`/job/${job.id}`}
                              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                            >
                              詳細を見る
                            </Link>
                            <Link
                              href={`/job/${job.id}/applications`}
                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                            >
                              📋 応募者
                            </Link>
                            {/* 応募者表示トグルボタン */}
                            {isOwnProfile && applications.length > 0 && (
                              <button
                                onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-semibold"
                              >
                                {isExpanded ? '▲ 応募者を隠す' : `▼ 応募者を表示 (${applications.length}件)`}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 応募した案件タブ */}
            {activeTab === 'my-applications' && isOwnProfile && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    応募した案件 ({myApplications.length}件)
                    {unreadApplicationNotifications > 0 && (
                      <span className="bg-red-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                        {unreadApplicationNotifications}
                      </span>
                    )}
                  </h3>
                </div>

                {myApplications.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">まだ応募していません</h3>
                    <p className="text-gray-500 mb-6">興味のある案件に応募してみましょう</p>
                    <Link
                      href="/"
                      className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      案件を探す
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {myApplications.map((app) => {
                      const statusConfig = getStatusBadge(app.status)
                      const hasUnreadNotification = app.status !== 'pending'
                      
                      return (
                        <div 
                          key={app.id} 
                          className={`border-2 rounded-xl p-8 hover:shadow-md transition-all ${
                            hasUnreadNotification ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <h4 className="text-xl font-bold text-gray-900">
                                  {app.jobs?.title || '案件'}
                                </h4>
                                <span className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${statusConfig.className}`}>
                                  {statusConfig.label}
                                </span>
                                {hasUnreadNotification && app.status !== 'pending' && (
                                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-2">
                                投稿者: {app.jobs?.client_name || app.jobs?.client_email}
                              </p>
                              <p className="text-gray-500 text-sm mb-4">
                                応募日: {new Date(app.created_at).toLocaleDateString('ja-JP')}
                              </p>
                              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 font-semibold mb-2">応募メッセージ:</p>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-3 leading-relaxed">
                                  {app.message}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Link
                              href={`/job/${app.job_id}`}
                              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                            >
                              案件詳細を見る
                            </Link>
                            {app.status === 'approved' && app.chat_room_id && (
                              <Link
                                href={`/chat/${app.chat_room_id}`}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all text-sm font-semibold"
                              >
                                💬 チャットを開く
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* プロフィール編集タブ */}
            {activeTab === 'edit' && isOwnProfile && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-8">プロフィール編集</h3>

                <div className="space-y-8">
                  {/* 基本情報セクション */}
                  <div className="bg-gray-50 border border-gray-200 p-8 rounded-xl">
                    <h4 className="text-xl font-bold text-gray-900 mb-6">基本情報</h4>
                    
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            名前 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="full_name"
                            value={profile.full_name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                            placeholder="山田太郎"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">メールアドレス</label>
                          <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed text-base"
                          />
                          <p className="text-xs text-gray-500 mt-1">※ メールアドレスは変更できません</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">自己紹介</label>
                        <textarea
                          name="bio"
                          value={profile.bio}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="あなたの経験や専門分野について教えてください..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">所属会社</label>
                        <input
                          type="text"
                          name="company_name"
                          value={profile.company_name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="株式会社〇〇"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">会社ホームページ・SNS</label>
                        <input
                          type="url"
                          name="company_website"
                          value={profile.company_website}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 強み・提供できる価値セクション */}
                  <div className="bg-blue-50 border-2 border-blue-200 p-8 rounded-xl">
                    <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      💪 強み・提供できる価値
                    </h4>

                    {/* タグ選択セクション */}
                    {Object.entries(tagCategories).map(([categoryName, tags]) => {
                      const fieldMap = {
                        '対象業種': 'target_industries',
                        '職種': 'job_types',
                        '解決できる課題': 'interested_challenges',
                        '得意な施策・手法': 'expertise_methods',
                        'スキル・専門分野': 'skills'
                      }
                      
                      const field = fieldMap[categoryName]
                      const selectedTags = profile[field] || []

                      return (
                        <div key={categoryName} className="mb-8 last:mb-0">
                          <label className="block text-sm font-bold text-gray-700 mb-3">{categoryName}</label>

                          {/* 選択中のタグ表示 */}
                          {selectedTags.length > 0 && (
                            <div className="mb-4 p-4 bg-white rounded-lg border-2 border-blue-300">
                              <div className="text-xs text-gray-600 mb-2 font-semibold">選択中 ({selectedTags.length}個):</div>
                              <div className="flex flex-wrap gap-2">
                                {selectedTags.map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"
                                  >
                                    {tag}
                                    <button
                                      type="button"
                                      onClick={() => removeTag(categoryName, tag)}
                                      className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* スキル・専門分野の場合は2階層 */}
                          {categoryName === 'スキル・専門分野' ? (
                            <>
                              {!selectedSkillCategory ? (
                                <div className="mb-4">
                                  <div className="text-xs text-gray-600 mb-2 font-semibold">カテゴリーを選択:</div>
                                  <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                      <button
                                        key={tag}
                                        type="button"
                                        onClick={() => setSelectedSkillCategory(tag)}
                                        className="px-3 py-2 bg-white hover:bg-blue-50 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                      >
                                        {tag} →
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="mb-4 p-4 bg-white rounded-lg border-2 border-gray-300">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-bold text-gray-700">{selectedSkillCategory}</div>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSkillCategory(null)}
                                      className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                                    >
                                      ← 戻る
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {skillDetails[selectedSkillCategory].map(skill => (
                                      <button
                                        key={skill}
                                        type="button"
                                        onClick={() => handleSkillDetailClick(skill)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                          selectedTags.includes(skill)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 hover:bg-blue-50 text-gray-700'
                                        }`}
                                      >
                                        {skill}
                                        {selectedTags.includes(skill) && ' ✓'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            /* 通常のタグ選択 */
                            <div className="mb-4">
                              <div className="text-xs text-gray-600 mb-2 font-semibold">選択:</div>
                              <div className="flex flex-wrap gap-2">
                                {tags.filter(tag => !selectedTags.includes(tag)).map(tag => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => addTag(categoryName, tag)}
                                    className="px-3 py-2 bg-white hover:bg-blue-50 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    + {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="pt-6 flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="px-8 py-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-base"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? '保存中...' : 'プロフィールを保存'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
