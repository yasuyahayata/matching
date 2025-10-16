import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState } from 'react'
import { 
  getStoredData, 
  setStoredData, 
  STORAGE_KEYS, 
  JOB_STATUS 
} from '../utils/jobStatus'

export default function PostJob() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: 'プログラミング',
    budget: '',
    deadline: '',
    description: '',
    skills: ''
  })

  const categories = ['プログラミング', 'デザイン', '動画・映像', 'ライティング', 'マーケティング']

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-4">案件を投稿するにはログインしてください。</p>
          <Link href="/login" className="text-blue-600 hover:underline">ログインページへ</Link>
        </div>
      </div>
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 既存の案件データを取得
      const existingJobs = getStoredData(STORAGE_KEYS.JOBS, [])
      
      // 新しい案件ID生成（既存の最大ID + 1）
      const newId = existingJobs.length > 0 ? Math.max(...existingJobs.map(job => job.id)) + 1 : 1
      
      // 新しい案件データ作成
      const newJob = {
        id: newId,
        title: formData.title,
        category: formData.category,
        budget: formData.budget,
        deadline: formData.deadline,
        description: formData.description,
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        proposals: 0,
        clientId: session.user.email,
        status: JOB_STATUS.RECRUITING,
        createdAt: new Date().toISOString()
      }

      // 案件データを保存
      const updatedJobs = [...existingJobs, newJob]
      setStoredData(STORAGE_KEYS.JOBS, updatedJobs)

      alert('案件を投稿しました！')
      router.push('/profile')
    } catch (error) {
      console.error('案件投稿エラー:', error)
      alert('案件投稿に失敗しました。')
    } finally {
      setLoading(false)
    }
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
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">ホーム</Link>
              <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">プロフィール</Link>
              <Link href="/messages" className="text-gray-700 hover:text-blue-600 transition-colors">💬 メッセージ</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページタイトル */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            新しい案件を投稿
          </h1>
          <p className="text-gray-600">プロジェクトの詳細を入力してフリーランサーを募集しましょう</p>
        </div>

        {/* 投稿フォーム */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 案件タイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件タイトル *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例：コーポレートサイトのリニューアル"
              />
            </div>

            {/* カテゴリと予算 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ *
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予算 *
                </label>
                <input
                  type="text"
                  name="budget"
                  required
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例：50,000円〜100,000円"
                />
              </div>
            </div>

            {/* 締切日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                締切日 *
              </label>
              <input
                type="date"
                name="deadline"
                required
                value={formData.deadline}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 案件詳細 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件詳細 *
              </label>
              <textarea
                name="description"
                required
                rows={6}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="プロジェクトの詳細、要件、期待する成果物などを具体的に記載してください..."
              />
            </div>

            {/* 必要スキル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                必要スキル
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例：React.js, Next.js, TypeScript （カンマ区切りで入力）"
              />
              <p className="text-sm text-gray-500 mt-1">
                必要なスキルをカンマ区切りで入力してください
              </p>
            </div>

            {/* 投稿ボタン */}
            <div className="pt-6">
              <div className="flex justify-between items-center">
                <Link
                  href="/profile"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← プロフィールに戻る
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      投稿中...
                    </div>
                  ) : (
                    '案件を投稿する'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
