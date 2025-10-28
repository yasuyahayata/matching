import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useToast } from '../../../components/ToastManager'

// タグカテゴリーの定義
const tagCategories = {
  '業種別': [
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
  '職種別': [
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
  '課題・目的別': [
    '新規顧客獲得',
    'リピート率向上',
    'ブランディング強化',
    'エンゲージメント向上',
    'LTV向上',
    '口コミ促進'
  ],
  '施策・手法別': [
    'コミュニティ運営',
    'SNSマーケティング',
    'イベント企画',
    'ロイヤリティプログラム',
    'UGC活用',
    'インフルエンサー連携'
  ],
  'スキル・専門分野別': [
    'プログラミング',
    'デザイン',
    '動画・映像',
    'ライティング',
    'マーケティング',
    'データ分析',
    'プロジェクト管理'
  ]
};

// スキル・専門分野の詳細（3階層目）
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

export default function EditJob() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    tags: []
  })
  
  const [selectedMainCategory, setSelectedMainCategory] = useState(null)
  const [selectedSkillCategory, setSelectedSkillCategory] = useState(null)

  useEffect(() => {
    if (id && session) {
      loadJob()
    }
  }, [id, session])

  const loadJob = async () => {
    try {
      setLoading(true)
      
      const jobId = parseInt(id, 10)

      const { data: jobData, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) throw error

      // 投稿者本人かチェック
      if (jobData.client_email !== session.user.email) {
        showToast('この案件を編集する権限がありません', 'error')
        router.push(`/job/${id}`)
        return
      }

      // フォームに既存データをセット
      setFormData({
        title: jobData.title || '',
        description: jobData.description || '',
        deadline: jobData.deadline ? jobData.deadline.split('T')[0] : '',
        tags: jobData.skills || []
      })

    } catch (error) {
      console.error('案件取得エラー:', error)
      showToast('案件情報の取得に失敗しました', 'error')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // メインカテゴリーをクリック
  const handleMainCategoryClick = (category) => {
    if (selectedMainCategory === category) {
      setSelectedMainCategory(null)
      setSelectedSkillCategory(null)
    } else {
      setSelectedMainCategory(category)
      setSelectedSkillCategory(null)
    }
  }

  // サブカテゴリーをクリック
  const handleSubCategoryClick = (subCategory) => {
    // スキル・専門分野別の場合は、詳細スキルを表示
    if (selectedMainCategory === 'スキル・専門分野別' && skillDetails[subCategory]) {
      setSelectedSkillCategory(subCategory)
      return
    }

    // 通常のタグ選択
    addTag(subCategory)
  }

  // 詳細スキルをクリック
  const handleDetailSkillClick = (skill) => {
    addTag(skill)
  }

  // スキルカテゴリーに戻る
  const backToSkillCategories = () => {
    setSelectedSkillCategory(null)
  }

  // タグ追加
  const addTag = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  // タグ削除
  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  // すべてのタグをクリア
  const clearAllTags = () => {
    setFormData(prev => ({
      ...prev,
      tags: []
    }))
    setSelectedMainCategory(null)
    setSelectedSkillCategory(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline || null,
          skills: formData.tags
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '更新に失敗しました')
      }

      showToast('案件を更新しました！', 'success')
      setTimeout(() => {
        router.push(`/job/${id}`)
      }, 1000)
    } catch (error) {
      console.error('案件更新エラー:', error)
      showToast(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // 今日の日付を取得（最小値として使用）
  const today = new Date().toISOString().split('T')[0]

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-4">案件を編集するにはログインしてください。</p>
          <Link href="/" className="text-blue-600 hover:underline">トップページへ</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">案件を編集</h1>
          <Link
            href={`/job/${id}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← 戻る
          </Link>
        </div>

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

          {/* 募集期限 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              募集期限
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              min={today}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              ※ 期限を設定しない場合は空欄のままにしてください
            </p>
          </div>

          {/* タグ選択（3階層システム） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ <span className="text-red-500">*</span>
            </label>

            {/* 選択中のタグ表示 */}
            {formData.tags.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">選択中のタグ ({formData.tags.length}個):</span>
                  <button
                    type="button"
                    onClick={clearAllTags}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    すべてクリア
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* メインカテゴリー */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">カテゴリーを選択:</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(tagCategories).map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleMainCategoryClick(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedMainCategory === category
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500'
                    }`}
                  >
                    {category}
                    <span className="ml-2">
                      {selectedMainCategory === category ? '▲' : '▼'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* サブカテゴリー（2階層目） */}
            {selectedMainCategory && !selectedSkillCategory && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-3">{selectedMainCategory}</div>
                <div className="flex flex-wrap gap-2">
                  {tagCategories[selectedMainCategory].map(subCategory => (
                    <button
                      key={subCategory}
                      type="button"
                      onClick={() => handleSubCategoryClick(subCategory)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.tags.includes(subCategory)
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500'
                      }`}
                    >
                      {subCategory}
                      {selectedMainCategory === 'スキル・専門分野別' && skillDetails[subCategory] && (
                        <span className="ml-1">→</span>
                      )}
                      {formData.tags.includes(subCategory) && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 詳細スキル（3階層目） */}
            {selectedSkillCategory && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-700">{selectedSkillCategory}</div>
                  <button
                    type="button"
                    onClick={backToSkillCategories}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← 戻る
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillDetails[selectedSkillCategory].map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleDetailSkillClick(skill)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.tags.includes(skill)
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500'
                      }`}
                    >
                      {skill}
                      {formData.tags.includes(skill) && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              ※ カテゴリーを選択してタグを追加してください。複数選択可能です。
            </p>
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
              rows="8"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="案件の詳細を記入してください"
            />
          </div>

          {/* 送信ボタン */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/job/${id}`)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || formData.tags.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '更新中...' : '変更を保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
