import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Apply() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [jobData, setJobData] = useState(null)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [formData, setFormData] = useState({
    proposalText: '',
    proposedPrice: '',
    proposedDeadline: '',
    portfolio: '',
    experience: '',
    availability: ''
  })

  // URLパラメータから案件IDを取得
  const { jobId } = router.query

  // ログインチェック
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h2>
          <p className="text-gray-600 mb-6">案件に応募するにはログインしてください。</p>
          <Link
            href="/login"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700"
          >
            ログインする
          </Link>
        </div>
      </div>
    )
  }

  // 案件データと応募状況を読み込み
  useEffect(() => {
    if (jobId) {
      loadJobData()
      checkAlreadyApplied()
    }
  }, [jobId, session])

  const loadJobData = () => {
    try {
      const savedJobs = localStorage.getItem('crowdwork_jobs')
      if (savedJobs) {
        const jobs = JSON.parse(savedJobs)
        const job = jobs.find(j => j.id.toString() === jobId)
        if (job) {
          setJobData(job)
        } else {
          // 案件が見つからない場合
          router.push('/')
        }
      }
    } catch (error) {
      console.error('案件データの読み込みエラー:', error)
      router.push('/')
    }
  }

  const checkAlreadyApplied = () => {
    try {
      const savedApplications = localStorage.getItem('crowdwork_applications')
      if (savedApplications && session) {
        const applications = JSON.parse(savedApplications)
        const existingApplication = applications.find(
          app => app.jobId.toString() === jobId && app.applicantEmail === session.user?.email
        )
        setAlreadyApplied(!!existingApplication)
      }
    } catch (error) {
      console.error('応募状況の確認エラー:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 応募データを作成
      const applicationData = {
        id: Date.now(),
        jobId: parseInt(jobId),
        jobTitle: jobData?.title || '',
        applicantEmail: session.user?.email,
        applicantName: session.user?.name || session.user?.email,
        proposalText: formData.proposalText,
        proposedPrice: formData.proposedPrice,
        proposedDeadline: formData.proposedDeadline,
        portfolio: formData.portfolio,
        experience: formData.experience,
        availability: formData.availability,
        appliedAt: new Date().toISOString(),
        status: 'pending'
      }

      // 既存の応募データを取得
      const savedApplications = localStorage.getItem('crowdwork_applications')
      let applications = []
      if (savedApplications) {
        applications = JSON.parse(savedApplications)
      }

      // 重複チェック（念のため）
      const existingApplication = applications.find(
        app => app.jobId.toString() === jobId && app.applicantEmail === session.user?.email
      )

      if (existingApplication) {
        alert('この案件にはすでに応募済みです。')
        setLoading(false)
        return
      }

      // 新しい応募を追加
      applications.push(applicationData)
      localStorage.setItem('crowdwork_applications', JSON.stringify(applications))

      // 成功メッセージと画面遷移
      setTimeout(() => {
        alert(`案件「${jobData?.title}」への応募が完了しました！\n応募内容を確認して、クライアントからの連絡をお待ちください。`)
        router.push('/')
        setLoading(false)
      }, 1000)

    } catch (error) {
      console.error('応募エラー:', error)
      alert('応募に失敗しました。もう一度お試しください。')
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // 案件データが読み込まれていない場合
  if (!jobData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // すでに応募済みの場合
  if (alreadyApplied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">    
            <div className="flex justify-between items-center h-16">  
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">   
                クラウドソーシング MVP
              </Link>
              <Link href="/" className="text-gray-600 hover:text-gray-900">ホームに戻る</Link>
            </div>
          </div>
        </nav>
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">応募済みです</h2>
            <p className="text-gray-600 mb-6">
              この案件「{jobData.title}」にはすでに応募済みです。<br/>
              クライアントからの連絡をお待ちください。
            </p>
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700"
            >
              他の案件を見る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">    
          <div className="flex justify-between items-center h-16">  
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">   
              クラウドソーシング MVP
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm">{session.user?.email}</span>
              <Link href="/" className="text-gray-600 hover:text-gray-900">ホーム</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 案件情報 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">   
          <h2 className="text-2xl font-bold text-gray-900 mb-4">応募する案件</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                {jobData.category}
              </span>
              <span className="text-2xl font-bold text-green-600">{jobData.budget}</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{jobData.title}</h3>
            <p className="text-gray-700 mb-4">{jobData.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>締切: {jobData.deadline}</span>
              <span>投稿日: {jobData.createdAt}</span>
            </div>
            {jobData.skills && Array.isArray(jobData.skills) && (
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-700 mr-2">必要スキル:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {jobData.skills.map((skill, index) => (
                    <span key={index} className="bg-white text-gray-700 px-2 py-1 rounded text-xs border">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 応募フォーム */}
        <div className="bg-white rounded-2xl shadow-xl p-8">        
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8 text-center">
            この案件に応募する
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">      
            {/* 提案文 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                提案文 <span className="text-red-500">*</span>
              </label>    
              <textarea
                name="proposalText"
                rows={8}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="あなたの経験、この案件に対するアプローチ、なぜ適任なのかを詳しく説明してください..."
                value={formData.proposalText}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
              {/* 希望報酬 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">希望報酬（円）</label>
                <input
                  type="number"
                  name="proposedPrice"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例：45000"
                  value={formData.proposedPrice}
                  onChange={handleChange}
                />
              </div>

              {/* 希望納期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">希望納期</label>
                <input
                  type="date"
                  name="proposedDeadline"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.proposedDeadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* ポートフォリオURL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ポートフォリオURL</label>
              <input
                type="url"
                name="portfolio"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourportfolio.com"
                value={formData.portfolio}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 経験年数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">関連経験年数</label>
                <select
                  name="experience"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.experience}
                  onChange={handleChange}
                >
                  <option value="">選択してください</option>
                  <option value="1年未満">1年未満</option>
                  <option value="1-2年">1-2年</option>
                  <option value="3-4年">3-4年</option>
                  <option value="5年以上">5年以上</option>
                </select>
              </div>

              {/* 対応可能時間 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">対応可能時間/週</label>
                <select
                  name="availability"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.availability}
                  onChange={handleChange}
                >
                  <option value="">選択してください</option>
                  <option value="10時間未満">10時間未満</option>
                  <option value="10-20時間">10-20時間</option>
                  <option value="20-30時間">20-30時間</option>
                  <option value="30時間以上">30時間以上</option>
                </select>
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-center space-x-4 pt-8">    
              <Link
                href="/"
                className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.proposalText.trim()} 
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    応募中...
                  </div>
                ) : (
                  '応募する'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
