import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { initializeTestUsers } from '../utils/userUtils'

const categories = ['すべて', 'プログラミング', 'デザイン', '動画・映像', 'ライティング', 'マーケティング']

export default function Home() {
  const { data: session } = useSession()
  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [searchTerm, setSearchTerm] = useState('')
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    // ユーザーデータとlocalStorageから案件データを読み込み
    const loadJobs = () => {
      if (typeof window !== 'undefined') {
        // テストユーザーを初期化
        initializeTestUsers()
        
        const savedJobs = localStorage.getItem('crowdwork_jobs')
        if (savedJobs) {
          const parsedJobs = JSON.parse(savedJobs)
          // 募集中の案件のみ表示
          const activeJobs = parsedJobs.filter(job => job.status === '募集中')
          setJobs(activeJobs)
        }
      }
    }

    loadJobs()
  }, [])

  const filteredJobs = jobs.filter(job => {
    const matchesCategory = selectedCategory === 'すべて' || job.category === selectedCategory
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // 金額を正しくフォーマットする関数
  const formatBudget = (budget) => {
    if (!budget) return '要相談'
    
    // 既に正しい形式の場合はそのまま返す
    if (typeof budget === 'string' && budget.includes('¥') && !budget.includes('¥¥')) {
      return budget
    }
    
    // 数値や文字列から¥と円を除去して数値部分のみ取得
    const numericValue = budget.toString().replace(/[¥,円]/g, '')
    
    // 数値でない場合は元の値を返す
    if (isNaN(numericValue)) return budget
    
    // 3桁区切りで表示
    return `¥${parseInt(numericValue).toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b-2 border-gradient-to-r from-blue-100 to-purple-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CrowdWork MVP
            </Link>
            
            {/* ナビゲーションメニュー */}
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                案件一覧
              </Link>
              <Link href="/post-job" className="text-gray-700 hover:text-blue-600 font-medium">
                案件投稿
              </Link>
              {session && (
                <>
                  <Link href="/my-applications" className="text-gray-700 hover:text-blue-600 font-medium">
                    応募履歴・メッセージ
                  </Link>
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600 font-medium">
                    プロフィール
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link 
                    href="/login"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                  >
                    ログイン
                  </Link>
                  <Link 
                    href="/register"
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                  >
                    新規登録
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* モバイルメニュー */}
          <div className="md:hidden mt-4">
            <nav className="flex flex-wrap gap-4">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                案件一覧
              </Link>
              <Link href="/post-job" className="text-gray-700 hover:text-blue-600 font-medium">
                案件投稿
              </Link>
              {session && (
                <>
                  <Link href="/my-applications" className="text-gray-700 hover:text-blue-600 font-medium">
                    応募履歴・メッセージ
                  </Link>
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600 font-medium">
                    プロフィール
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* ヒーローセクション */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            理想の案件と出会おう
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            プロフェッショナルなフリーランサーと企業をつなぐプラットフォーム
          </p>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="案件を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Link 
              href="/post-job"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium text-center"
            >
              案件を投稿する
            </Link>
          </div>

          {/* カテゴリフィルター */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 案件一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 text-lg">表示する案件がありません</p>
              <Link 
                href="/post-job"
                className="mt-4 inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
              >
                最初の案件を投稿する
              </Link>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200">
                <div className="mb-4">
                  <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {job.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3 hover:text-blue-600 transition-colors">
                  <Link href={`/job/${job.id}`}>
                    {job.title}
                  </Link>
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {job.description}
                </p>
                
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {job.skills?.slice(0, 3).map((skill, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                    {job.skills?.length > 3 && (
                      <span className="text-gray-500 text-sm">+{job.skills.length - 3}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                  <span className="font-medium text-green-600">
                    {formatBudget(job.budget)}
                  </span>
                  <span>
                    期限: {job.deadline ? new Date(job.deadline).toLocaleDateString('ja-JP') : '要相談'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    提案数: {job.proposals || 0}件
                  </span>
                  <Link 
                    href={`/job/${job.id}`}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-sm font-medium"
                  >
                    詳細を見る
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 CrowdWork MVP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
