import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// 都道府県リスト
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県', '海外'
]

// スキル一覧（カテゴリ別）
const skillsData = {
  'プログラミング': [
    'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 
    'Python', 'Java', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 
    'C#', 'Node.js', 'Django', 'Flask', 'Laravel', 'Ruby on Rails', 
    'Next.js', 'Nuxt.js', 'Express.js'
  ],
  'デザイン': [
    'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 
    'InDesign', 'After Effects', 'Premiere Pro', 'Blender', 
    'Canva', 'UI/UX', 'グラフィックデザイン', 'ロゴデザイン'
  ],
  'マーケティング': [
    'Google Analytics', 'SEO', 'SEM', 'SNS運用', 'Facebook広告', 
    'Google広告', 'Instagram運用', 'Twitter運用', 'LINE広告',
    'コンテンツマーケティング', 'メールマーケティング', 'アフィリエイト'
  ],
  'ライティング': [
    'SEOライティング', 'コピーライティング', '技術文書作成', 
    '翻訳（英日）', '翻訳（日英）', '校正', '編集', 'ブログ執筆',
    'プレスリリース', 'シナリオ作成'
  ],
  '動画・映像': [
    '動画編集', 'アニメーション', 'モーショングラフィックス',
    'YouTube編集', 'TikTok編集', '撮影', '字幕作成', '音声編集'
  ],
  'その他': [
    'Excel', 'PowerPoint', 'Word', 'SQL', 'Git', 'Docker', 
    'AWS', 'Firebase', 'WordPress', 'Shopify', 'データ分析',
    'プロジェクト管理', 'Slack', 'Notion'
  ]
}

// よく使われるスキル
const popularSkills = [
  'React', 'Vue.js', 'TypeScript', 'JavaScript', 'Python', 
  'PHP', 'Figma', 'Photoshop', 'Illustrator', 'WordPress',
  'SEO', 'Google Analytics', 'Excel'
]

export default function Profile() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    bio: '',
    skills: [],
    location: '',
    portfolio_url: '',
    avatar_url: ''
  })

  const [skillSearch, setSkillSearch] = useState('')
  const [showAllSkills, setShowAllSkills] = useState(false)

  const [postedJobs, setPostedJobs] = useState([])
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0
  })

  useEffect(() => {
    if (session) {
      loadProfile()
      loadPostedJobs()
    }
  }, [session])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('プロフィール読み込みエラー:', error)
      }

      if (data) {
        setProfile({
          full_name: data.full_name || session.user.name || '',
          email: data.email || session.user.email || '',
          bio: data.bio || '',
          skills: data.skills || [],
          location: data.location || '',
          portfolio_url: data.portfolio_url || '',
          avatar_url: data.avatar_url || session.user.image || ''
        })
      } else {
        setProfile({
          full_name: session.user.name || '',
          email: session.user.email || '',
          bio: '',
          skills: [],
          location: '',
          portfolio_url: '',
          avatar_url: session.user.image || ''
        })
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPostedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_email', session.user.email)
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

  // スキル追加
  const addSkill = (skill) => {
    if (!profile.skills.includes(skill)) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    }
  }

  // スキル削除
  const removeSkill = (skill) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  // スキル検索フィルター
  const getFilteredSkills = () => {
    if (!skillSearch) return []
    
    const allSkills = Object.values(skillsData).flat()
    return allSkills.filter(skill => 
      skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !profile.skills.includes(skill)
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // プロフィールが存在するか確認
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
        // 更新
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: profile.full_name,
            bio: profile.bio,
            skills: profile.skills,
            location: profile.location,
            portfolio_url: profile.portfolio_url,
            updated_at: new Date().toISOString()
          })
          .eq('email', session.user.email)

        if (error) throw error
      } else {
        // 新規作成（idは自動生成される）
        const { error } = await supabase
          .from('profiles')
          .insert([
            {
              email: profile.email,
              full_name: profile.full_name,
              bio: profile.bio,
              skills: profile.skills,
              location: profile.location,
              portfolio_url: profile.portfolio_url,
              avatar_url: session.user.image || ''
            }
          ])

        if (error) throw error
      }

      alert('プロフィールを保存しました！')
      await loadProfile()
      setActiveTab('overview')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('プロフィールの保存に失敗しました: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const formatBudget = (budget) => {
    if (!budget) return '予算相談'
    return `¥${budget.toLocaleString()}`
  }

  const formatDate = (date) => {
    if (!date) return '期限なし'
    return new Date(date).toLocaleDateString('ja-JP')
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-4">プロフィールを見るにはログインしてください。</p>
          <Link href="/" className="text-blue-600 hover:underline">トップページへ</Link>
        </div>
      </div>
    )
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* プロフィールヘッダー */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              (profile.full_name.charAt(0) || 'U').toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{profile.full_name || 'ユーザー'}</h1>
            <p className="text-gray-600 mb-2">{profile.email}</p>
            <p className="text-gray-600">{profile.bio || 'プロフィールを設定してください'}</p>
            {profile.location && (
              <p className="text-gray-500 mt-2">📍 {profile.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white rounded-2xl shadow-xl mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-8">
            {[
              { id: 'overview', label: '概要', icon: '📊' },
              { id: 'posted-jobs', label: '投稿した案件', icon: '📝' },
              { id: 'edit', label: 'プロフィール編集', icon: '✏️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
          {/* 概要タブ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-2">総投稿数</h3>
                  <p className="text-3xl font-bold">{stats.totalJobs}</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-2">募集中</h3>
                  <p className="text-3xl font-bold">{stats.activeJobs}</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-2">完了</h3>
                  <p className="text-3xl font-bold">{stats.completedJobs}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-1 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">スキル</h3>
                  <div className="bg-gray-50 p-4 rounded-lg min-h-[100px]">
                    {profile.skills && profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <span key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">スキルを設定してください</p>
                    )}
                  </div>
                </div>
              </div>

              {profile.portfolio_url && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">ポートフォリオ</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {profile.portfolio_url}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 投稿した案件タブ */}
          {activeTab === 'posted-jobs' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">投稿した案件 ({postedJobs.length}件)</h3>
                <Link
                  href="/post-job"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md"
                >
                  + 新しい案件を投稿
                </Link>
              </div>

              {postedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">まだ案件を投稿していません</h3>
                  <p className="text-gray-500 mb-4">最初の案件を投稿してみましょう</p>
                  <Link
                    href="/post-job"
                    className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md"
                  >
                    案件を投稿する
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {postedJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{job.title}</h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              job.status === '募集中' ? 'bg-green-100 text-green-800' :
                              job.status === '進行中' ? 'bg-blue-100 text-blue-800' :
                              job.status === '完了' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {job.status || '募集中'}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>💰 {formatBudget(job.budget)}</span>
                            <span>📅 {formatDate(job.deadline)}</span>
                            <span>📂 {job.category}</span>
                          </div>
                          {job.skills && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {job.skills.slice(0, 5).map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 5 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  +{job.skills.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Link
                          href={`/job/${job.id}`}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all text-sm"
                        >
                          詳細を見る
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* プロフィール編集タブ */}
          {activeTab === 'edit' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">プロフィール編集</h3>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={profile.full_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="山田太郎"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">※ メールアドレスは変更できません</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介</label>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="あなたのスキルや経験について教えてください..."
                  />
                </div>

                {/* 所在地（ドロップダウン） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">所在地</label>
                  <select
                    name="location"
                    value={profile.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {PREFECTURES.map((prefecture) => (
                      <option key={prefecture} value={prefecture}>
                        {prefecture}
                      </option>
                    ))}
                  </select>
                </div>

                {/* スキル（タグ選択式） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">スキル</label>

                  {/* 選択中のスキル表示 */}
                  {profile.skills.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-gray-600 mb-2">選択中のスキル ({profile.skills.length}個):</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map(skill => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 検索バー */}
                  <div className="mb-4">
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder="🔍 スキルを検索..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* 検索結果 */}
                    {skillSearch && getFilteredSkills().length > 0 && (
                      <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {getFilteredSkills().slice(0, 10).map(skill => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => {
                                addSkill(skill)
                                setSkillSearch('')
                              }}
                              className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 rounded-full text-sm transition-colors"
                            >
                              + {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* よく使われるスキル */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">よく使われるスキル:</div>
                    <div className="flex flex-wrap gap-2">
                      {popularSkills.filter(skill => !profile.skills.includes(skill)).map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="px-3 py-1 bg-white hover:bg-blue-50 border border-gray-300 text-gray-700 rounded-full text-sm transition-colors"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* もっと見るボタン */}
                  <button
                    type="button"
                    onClick={() => setShowAllSkills(!showAllSkills)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {showAllSkills ? '▲ 閉じる' : '▼ すべてのスキルを見る'}
                  </button>

                  {/* カテゴリ別全スキル */}
                  {showAllSkills && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                      {Object.entries(skillsData).map(([category, skills]) => (
                        <div key={category} className="mb-4 last:mb-0">
                          <div className="text-sm font-semibold text-gray-700 mb-2">{category}</div>
                          <div className="flex flex-wrap gap-2">
                            {skills.filter(skill => !profile.skills.includes(skill)).map(skill => (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => addSkill(skill)}
                                className="px-3 py-1 bg-white hover:bg-blue-50 border border-gray-300 text-gray-700 rounded-full text-sm transition-colors"
                              >
                                + {skill}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ポートフォリオURL</label>
                  <input
                    type="url"
                    name="portfolio_url"
                    value={profile.portfolio_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://your-portfolio.com"
                  />
                </div>

                <div className="pt-6 flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
  )
}
