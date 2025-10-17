import { useSession, signOut, signIn } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const categories = ['すべて', 'プログラミング', 'デザイン', '動画・映像', 'ライティング', 'マーケティング']

export default function Home() {
  const { data: session } = useSession()
  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [searchTerm, setSearchTerm] = useState('')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', '募集中')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setJobs(data || [])
    } catch (error) {
      console.error('案件取得エラー:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesCategory = selectedCategory === 'すべて' || job.category === selectedCategory
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job.skills && job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())))

    return matchesCategory && matchesSearch
  })

  const formatBudget = (budget) => {
    if (!budget) return '予算相談'
    return `¥${budget.toLocaleString()}`
  }

  const formatDeadline = (deadline) => {
    if (!deadline) return '期限相談'
    return new Date(deadline).toLocaleDateString('ja-JP')
  }

  const formatSkills = (skills) => {
    if (!skills || skills.length === 0) return []
    return skills
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CrowdWork
            </Link>

            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">案件一覧</Link>
              {session && (
                <Link href="/post-job" className="text-gray-700 hover:text-blue-600 transition-colors">案件投稿</Link>
              )}
              <Link href="/messages" className="text-gray-700 hover:text-blue-600 transition-colors">💬 メッセージ</Link>
            </nav>

            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <Link 
                    href="/profile"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:shadow-lg transition-shadow">
                      {session.user.image ? (
                        <img src={session.user.image} alt={session.user.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        (session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U').toUpperCase()
                      )}
                    </div>
                    <span className="font-medium">
                      {session.user.name || session.user.email}
                    </span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg border border-gray-300 transition-colors flex items-center space-x-2 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Googleでログイン</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索・フィルター */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="案件を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 案件一覧 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">該当する案件が見つかりませんでした</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium">
                      {job.category}
                    </span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {formatBudget(job.budget)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                    {job.title}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {formatSkills(job.skills).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      📅 {formatDeadline(job.deadline)}
                    </span>
                    <Link
                      href={`/job/${job.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      詳細を見る →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
