import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/ToastManager'

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

export default function PostJob() {
  const { data: session } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    tags: []
  })
  
  const [selectedMainCategory, setSelectedMainCategory] = useState(null)
  const [selectedSkillCategory, setSelectedSkillCategory] = useState(null)

  // プロフィール情報を取得
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('email', session.user.email)
        .single()

      if (data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-xl shadow-lg max-w-md border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-6">案件を投稿するにはログインしてください。</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            トップページへ
          </Link>
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
    setLoading(true)

    try {
      const category = formData.tags.length > 0 ? formData.tags[0] : 'その他'

      // client_nameの優先順位: プロフィールの会社名 > プロフィールの氏名 > Googleの名前 > メールアドレス
      const clientName = userProfile?.company_name || 
                        userProfile?.full_name || 
                        session.user.name || 
                        session.user.email.split('@')[0]

      const { data, error } = await supabase
        .from('jobs')
        .insert([
          {
            title: formData.title,
            category: category,
            description: formData.description,
            deadline: formData.deadline || null,
            skills: formData.tags,
            client_email: session.user.email,
            client_name: clientName,
            status: '募集中'
          }
        ])
        .select()

      if (error) {
        throw error
      }

      showToast('案件を投稿しました！', 'success')
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (error) {
      console.error('案件投稿エラー:', error)
      showToast('案件投稿に失敗しました: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // 今日の日付を取得（最小値として使用）
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">案件を投稿</h1>
            <p className="text-gray-600 text-lg">企業とのマッチングに必要な情報を入力してください</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* 案件タイトル */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-3">
                案件タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="例：Webサイトのデザインをお願いします"
              />
            </div>

            {/* 募集期限 */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-3">
                募集期限
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                min={today}
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
              <p className="text-sm text-gray-500 mt-2">
                ※ 期限を設定しない場合は空欄のままにしてください
              </p>
            </div>

            {/* タグ選択（3階層システム） */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-3">
                カテゴリ <span className="text-red-500">*</span>
              </label>

              {/* 選択中のタグ表示 */}
              {formData.tags.length > 0 && (
                <div className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-gray-700">選択中のタグ ({formData.tags.length}個):</span>
                    <button
                      type="button"
                      onClick={clearAllTags}
                      className="text-sm text-red-600 hover:text-red-700 font-semibold"
                    >
                      すべてクリア
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:bg-white/20 rounded-full p-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* メインカテゴリー */}
              <div className="mb-6">
                <div className="text-sm font-bold text-gray-700 mb-3">カテゴリーを選択:</div>
                <div className="flex flex-wrap gap-3">
                  {Object.keys(tagCategories).map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleMainCategoryClick(category)}
                      className={`px-5 py-3 rounded-lg text-base font-semibold transition-all ${
                        selectedMainCategory === category
                          ? 'bg-blue-600 text-white'
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
                <div className="mb-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <div className="text-base font-bold text-gray-900 mb-4">{selectedMainCategory}</div>
                  <div className="flex flex-wrap gap-3">
                    {tagCategories[selectedMainCategory].map(subCategory => (
                      <button
                        key={subCategory}
                        type="button"
                        onClick={() => handleSubCategoryClick(subCategory)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          formData.tags.includes(subCategory)
                            ? 'bg-green-600 text-white'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500'
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
                <div className="mb-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-base font-bold text-gray-900">{selectedSkillCategory}</div>
                    <button
                      type="button"
                      onClick={backToSkillCategories}
                      className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      ← 戻る
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {skillDetails[selectedSkillCategory].map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleDetailSkillClick(skill)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          formData.tags.includes(skill)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500'
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

              <p className="text-sm text-gray-500 mt-3">
                ※ カテゴリーを選択してタグを追加してください。複数選択可能です。
              </p>
            </div>

            {/* 案件詳細 */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-3">
                案件詳細 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="10"
                className="w-full px-5 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base leading-relaxed"
                placeholder="案件の詳細を記入してください"
              />
            </div>

            {/* 送信ボタン */}
            <div className="flex space-x-4 pt-6 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 py-4 px-6 rounded-lg font-semibold text-base transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading || formData.tags.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
