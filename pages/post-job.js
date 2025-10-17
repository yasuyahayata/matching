import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PostJob() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: 'プログラミング',
    budget: 50000, // 初期値: ¥50,000
    deadline: '',
    description: '',
    skills: '',
    experience_level: '初級'
  })

  const categories = ['プログラミング', 'デザイン', '動画・映像', 'ライティング', 'マーケティング']
  const experienceLevels = ['初級', '中級', '上級']

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-4">案件を投稿するにはログインしてください。</p>
          <Link href="/" className="text-blue-600 hover:underline">トップページへ</Link>
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

  // 予算スライダー専用ハンドラー
  const handleBudgetChange = (e) => {
    const value = parseInt(e.target.value)
    // 1,000円単位に丸める
    const roundedValue = Math.round(value / 1000) * 1000
    setFormData(prev => ({
      ...prev,
      budget: roundedValue
    }))
  }

  // 予算の直接入力ハンドラー
  const handleBudgetInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '') // 数字のみ
    const numValue = parseInt(value) || 5000
    
    // 最小値・最大値の制限
    let constrainedValue = Math.max(5000, Math.min(500000, numValue))
    
    // 1,000円単位に丸める
    constrainedValue = Math.round(constrainedValue / 1000) * 1000
    
    setFormData(prev => ({
      ...prev,
      budget: constrainedValue
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // スキルを配列に変換
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill)

      // Supabaseに新しい案件を挿入
      const { data, error } = await supabase
        .from('jobs')
        .insert([
          {
            title: formData.title,
            category: formData.category,
            budget: formData.budget,
            deadline: formData.deadline || null,
            description: formData.description,
            skills: skillsArray,
            experience_level: formData.experience_level,
            client_email: session.user.email,
            client_name: session.user.name || session.user.email,
            status: '募集中'
          }
        ])
        .select()

      if (error) {
        throw error
      }

      alert('案件を投稿しました！')
      router.push('/')
    } catch (error) {
      console.error('案件投稿エラー:', error)
      alert('案件投稿に失敗しました: ' + error.message)
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

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">案件を投稿</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 案件タイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例：Webサイトのデザインをお願いします"
              />
            </div>

            {/* カテゴリ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* 予算スライダー（改良版） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予算 <span className="text-red-500">*</span>
              </label>
              
              {/* 現在の予算表示 */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">選択中の予算:</span>
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    ¥{formData.budget.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* スライダー */}
              <div className="mb-4">
                <input
                  type="range"
                  min="5000"
                  max="500000"
                  step="1000"
                  value={formData.budget}
                  onChange={handleBudgetChange}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((formData.budget - 5000) / (500000 - 5000)) * 100}%, #e5e7eb ${((formData.budget - 5000) / (500000 - 5000)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>¥5,000</span>
                  <span>¥250,000</span>
                  <span>¥500,000</span>
                </div>
              </div>

              {/* 直接入力オプション */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">または直接入力:</span>
                <input
                  type="text"
                  value={`¥${formData.budget.toLocaleString()}`}
                  onChange={handleBudgetInputChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-semibold"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">※ 1,000円単位で自動調整されます（最低¥5,000〜最高¥500,000）</p>
            </div>

            {/* 納期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                納期
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 経験レベル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                経験レベル
              </label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {experienceLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* 案件詳細 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件詳細 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="案件の詳細を記入してください"
              />
            </div>

            {/* 必要なスキル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                必要なスキル
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例：React, TypeScript, Figma（カンマ区切り）"
              />
              <p className="text-xs text-gray-500 mt-1">※ スキルをカンマ区切りで入力してください</p>
            </div>

            {/* 送信ボタン */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '投稿中...' : '案件を投稿'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
