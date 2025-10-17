import { useSession, signOut } from 'next-auth/react'
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
      alert('案件の取得に失敗しました: ' + error.message)
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
              <Link href="/post-job" className="text-gray-700 hover:text-blue-600 transition-colors">案件投稿</Link>
              <Link href="/messages" className="text-gray-700 hover:text-blue-600 transition-colors">💬 メッセージ</Link>
            </nav>

            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">
                    👤 {session.user.name || session.user.email}
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <Link href="/auth/signin" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  ログイン
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヒーローセクション */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            理想の案件と
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              出会おう
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            フリーランサーとクライアントをつなぐプラットフォーム
          </p>
          
          {session && (
            <Link href="/post-job" className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              📝 案件を投稿する
            </Link>
          )}
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="案件を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 案件一覧 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {selectedCategory === 'すべて' ? '全ての案件' : `${selectedCategory}の案件`}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({loading ? '読み込み中...' : `${filteredJobs.length}件`})
            </span>
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">案件を読み込み中...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">案件が見つかりません</h3>
              <p className="text-gray-600">別のカテゴリや検索条件をお試しください</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map(job => (
                <div key={job.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {job.category}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        {job.experience_level}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                      {job.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {job.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-700">
                        <span className="font-medium">💰 予算:</span>
                        <span className="ml-2">{formatBudget(job.budget)}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <span className="font-medium">📅 納期:</span>
                        <span className="ml-2">{formatDeadline(job.deadline)}</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <span className="font-medium">👤 投稿者:</span>
                        <span className="ml-2">{job.client_name || job.client_email}</span>
                      </div>
                    </div>
                    
                    {formatSkills(job.skills).length > 0 && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-700 mb-2 block">必要スキル:</span>
                        <div className="flex flex-wrap gap-1">
                          {formatSkills(job.skills).slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                          {formatSkills(job.skills).length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              +{formatSkills(job.skills).length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleDateString('ja-JP')} 投稿
                      </span>
                      <Link href={`/job/${job.id}`} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                        詳細を見る
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
