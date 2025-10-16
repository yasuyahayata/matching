import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  getStoredData, 
  STORAGE_KEYS,
  JOB_STATUS,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  APPLICATION_STATUS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS
} from '../utils/jobStatus'

export default function Profile() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    location: ''
  })
  const [postedJobs, setPostedJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [receivedReviews, setReceivedReviews] = useState([])
  const [givenReviews, setGivenReviews] = useState([])

  useEffect(() => {
    if (session) {
      loadProfile()
      loadPostedJobs()
      loadApplications()
      loadReviews()
    }
  }, [session])

  const loadProfile = () => {
    const savedProfile = getStoredData(STORAGE_KEYS.USER_PROFILE, {})
    const userProfile = savedProfile[session?.user?.email] || {}
    
    setProfile({
      name: userProfile.name || session?.user?.name || '',
      email: userProfile.email || session?.user?.email || '',
      bio: userProfile.bio || '',
      skills: userProfile.skills || '',
      hourlyRate: userProfile.hourlyRate || '',
      location: userProfile.location || ''
    })
  }

  const loadPostedJobs = () => {
    const jobs = getStoredData(STORAGE_KEYS.JOBS, [])
    const myJobs = jobs.filter(job => job.clientId === session?.user?.email)
    console.log('読み込んだ投稿案件:', myJobs) // デバッグ用
    setPostedJobs(myJobs)
  }

  const loadApplications = () => {
    const apps = getStoredData(STORAGE_KEYS.APPLICATIONS, [])
    const myApps = apps.filter(app => app.userId === session?.user?.email)
    setApplications(myApps)
  }

  const loadReviews = () => {
    const reviews = getStoredData(STORAGE_KEYS.REVIEWS, [])
    const received = reviews.filter(review => review.revieweeId === session?.user?.email)
    const given = reviews.filter(review => review.reviewerId === session?.user?.email)
    setReceivedReviews(received)
    setGivenReviews(given)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    const updatedProfile = {
      ...profile,
      updatedAt: new Date().toISOString()
    }
    
    const profiles = getStoredData(STORAGE_KEYS.USER_PROFILE, {})
    profiles[session?.user?.email] = updatedProfile
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profiles))
    
    alert('プロフィールを保存しました！')
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const calculateAverageRating = (reviews) => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ))
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <Link href="/login" className="text-blue-600 hover:underline">ログインページへ</Link>
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
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CrowdWork
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                  案件を探す
                </Link>
                <Link href="/post-job" className="text-gray-700 hover:text-blue-600 transition-colors">
                  案件を投稿
                </Link>
                <Link href="/messages" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center">
                  💬 メッセージ
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                こんにちは、{session.user?.name || session.user?.email}さん
              </span>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* プロフィールヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {profile.name.charAt(0) || session.user?.email?.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{profile.name || session.user?.email}</h1>
              <p className="text-gray-600 mb-4">{profile.bio || 'プロフィールを設定してください'}</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {renderStars(Math.round(calculateAverageRating(receivedReviews)))}
                  <span className="ml-2 text-gray-600">
                    {calculateAverageRating(receivedReviews)} ({receivedReviews.length}件)
                  </span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{profile.location || '場所未設定'}</span>
              </div>
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
                { id: 'applications', label: '応募履歴', icon: '📋' },
                { id: 'reviews', label: 'レビュー', icon: '⭐' },
                { id: 'edit', label: 'プロフィール編集', icon: '✏️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
                    <h3 className="text-lg font-semibold mb-2">投稿した案件</h3>
                    <p className="text-3xl font-bold">{postedJobs.length}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">応募した案件</h3>
                    <p className="text-3xl font-bold">{applications.length}</p>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">平均評価</h3>
                    <p className="text-3xl font-bold">{calculateAverageRating(receivedReviews)}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">スキル</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {profile.skills ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.split(',').map((skill, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">スキルを設定してください</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">時給</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {profile.hourlyRate ? `¥${profile.hourlyRate}/時間` : '未設定'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 投稿した案件タブ */}
            {activeTab === 'posted-jobs' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">投稿した案件</h3>
                  <Link
                    href="/post-job"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    新しい案件を投稿
                  </Link>
                </div>
                
                {postedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">まだ案件を投稿していません</h3>
                    <p className="text-gray-500 mb-4">最初の案件を投稿してみましょう</p>
                    <Link
                      href="/post-job"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
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
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${JOB_STATUS_COLORS[job.status || JOB_STATUS.RECRUITING]}`}>
                                {JOB_STATUS_LABELS[job.status || JOB_STATUS.RECRUITING]}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">{job.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>予算: {job.budget}</span>
                              <span>締切: {job.deadline}</span>
                              <span>応募: {job.proposals || 0}件</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Link
                            href={`/job/${job.id}`}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-sm"
                          >
                            詳細を見る
                          </Link>
                          <Link
                            href={`/job/${job.id}/applicants`}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 text-sm"
                          >
                            👥 応募者管理
                          </Link>
                          {job.assignedFreelancer && (
                            <Link
                              href={`/messages/${job.id}`}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm"
                            >
                              💬 チャット
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 応募履歴タブ */}
            {activeTab === 'applications' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-6">応募履歴</h3>
                
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">まだ応募していません</h3>
                    <p className="text-gray-500 mb-4">興味のある案件に応募してみましょう</p>
                    <Link
                      href="/"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      案件を探す
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app, index) => (
                      <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-800">{app.jobTitle}</h4>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${APPLICATION_STATUS_COLORS[app.status || APPLICATION_STATUS.PENDING]}`}>
                                {APPLICATION_STATUS_LABELS[app.status || APPLICATION_STATUS.PENDING]}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">{app.proposal}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>提案金額: {app.proposedBudget}</span>
                              <span>完了予定: {app.estimatedDelivery}</span>
                              <span>応募日: {new Date(app.appliedAt).toLocaleDateString('ja-JP')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Link
                            href={`/job/${app.jobId}`}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-sm"
                          >
                            案件詳細
                          </Link>
                          {app.status === APPLICATION_STATUS.APPROVED && (
                            <Link
                              href={`/messages/${app.jobId}`}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm"
                            >
                              💬 チャット
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* レビュータブ */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* 受け取ったレビュー */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">受け取ったレビュー</h3>
                  {receivedReviews.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">⭐</div>
                      <p className="text-gray-500">まだレビューがありません</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {receivedReviews.map((review, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                {renderStars(review.rating)}
                                <span className="text-gray-600">({review.rating}/5)</span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {review.reviewerName} さんから
                              </p>
                            </div>
                            <span className="text-sm text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 投稿したレビュー */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">投稿したレビュー</h3>
                  {givenReviews.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📝</div>
                      <p className="text-gray-500">まだレビューを投稿していません</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {givenReviews.map((review, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                {renderStars(review.rating)}
                                <span className="text-gray-600">({review.rating}/5)</span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {review.revieweeName} さんへ
                              </p>
                            </div>
                            <span className="text-sm text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* プロフィール編集タブ */}
            {activeTab === 'edit' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-6">プロフィール編集</h3>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="お名前を入力"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                      <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介</label>
                    <textarea
                      name="bio"
                      value={profile.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="自己紹介を入力してください..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">スキル（カンマ区切り）</label>
                      <input
                        type="text"
                        name="skills"
                        value={profile.skills}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="React, JavaScript, デザイン"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">時給（円）</label>
                      <input
                        type="number"
                        name="hourlyRate"
                        value={profile.hourlyRate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="3000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">所在地</label>
                    <input
                      type="text"
                      name="location"
                      value={profile.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="東京都, 日本"
                    />
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    >
                      プロフィールを保存
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
