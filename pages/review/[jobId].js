import { useState, useEffect } from 'react'
import { useSession, getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ReviewJob() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { jobId } = router.query
  const [job, setJob] = useState(null)
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    communication: 5,
    quality: 5,
    timeliness: 5,
    overall: 5
  })

  // ログインチェック
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  useEffect(() => {
    if (jobId && session) {
      loadJobAndApplication()
    }
  }, [jobId, session])

  const loadJobAndApplication = async () => {
    try {
      // 案件データを取得
      const savedJobs = localStorage.getItem('crowdwork_jobs')
      if (savedJobs) {
        const jobs = JSON.parse(savedJobs)
        const foundJob = jobs.find(j => j.id.toString() === jobId)
        if (foundJob) {
          setJob(foundJob)
        } else {
          router.push('/')
          return
        }
      }

      // 応募データを取得（この案件に関する応募を確認）
      const savedApplications = localStorage.getItem('crowdwork_applications')
      if (savedApplications) {
        const applications = JSON.parse(savedApplications)
        // 案件投稿者が評価する場合：応募者を評価
        // 応募者が評価する場合：案件投稿者を評価
        const relatedApplication = applications.find(app => 
          app.jobId.toString() === jobId && 
          (app.applicantEmail === session.user?.email || foundJob?.createdBy === session.user?.email)
        )
        
        if (relatedApplication) {
          setApplication(relatedApplication)
        } else {
          // 関連する応募がない場合はホームに戻る
          router.push('/')
          return
        }
      }

    } catch (error) {
      console.error('データ読み込みエラー:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setReviewData(prev => ({
      ...prev,
      [name]: name === 'comment' ? value : parseInt(value)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // レビューデータを作成
      const review = {
        id: Date.now(),
        jobId: parseInt(jobId),
        jobTitle: job.title,
        reviewerId: session.user?.email,
        reviewerName: session.user?.name || session.user?.email,
        // 案件投稿者が評価する場合：応募者を評価
        // 応募者が評価する場合：案件投稿者を評価
        revieweeId: job.createdBy === session.user?.email ? application.applicantEmail : job.createdBy,
        revieweeName: job.createdBy === session.user?.email ? application.applicantName : job.createdBy,
        reviewerType: job.createdBy === session.user?.email ? 'client' : 'freelancer',
        rating: reviewData.rating,
        comment: reviewData.comment,
        communication: reviewData.communication,
        quality: reviewData.quality,
        timeliness: reviewData.timeliness,
        overall: reviewData.overall,
        createdAt: new Date().toISOString(),
        status: 'published'
      }

      // 既存のレビューを取得
      const savedReviews = localStorage.getItem('crowdwork_reviews')
      let reviews = []
      if (savedReviews) {
        reviews = JSON.parse(savedReviews)
      }

      // 重複チェック
      const existingReview = reviews.find(r => 
        r.jobId.toString() === jobId && 
        r.reviewerId === session.user?.email
      )

      if (existingReview) {
        alert('この案件に対するレビューは既に投稿済みです。')
        setSubmitting(false)
        return
      }

      // 新しいレビューを追加
      reviews.push(review)
      localStorage.setItem('crowdwork_reviews', JSON.stringify(reviews))

      // 成功メッセージ
      setTimeout(() => {
        alert('レビューが投稿されました！')
        router.push('/profile')
        setSubmitting(false)
      }, 1000)

    } catch (error) {
      console.error('レビュー投稿エラー:', error)
      alert('レビューの投稿に失敗しました。')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">レビューできません</h2>
          <p className="text-gray-600 mb-6">この案件に関するレビュー権限がありません。</p>
          <Link
            href="/"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  const isClientReviewing = job.createdBy === session.user?.email
  const targetUser = isClientReviewing ? application.applicantName : job.createdBy

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
              <Link href="/profile" className="text-gray-600 hover:text-gray-900">プロフィール</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 案件情報 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">案件情報</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                {job.category}
              </span>
              <span className="text-xl font-bold text-green-600">{job.budget}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
            <p className="text-gray-700 mb-4">{job.description}</p>
            <div className="text-sm text-gray-600">
              <span>締切: {job.deadline}</span>
              <span className="ml-4">投稿日: {job.createdAt}</span>
            </div>
          </div>
        </div>

        {/* レビューフォーム */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              {isClientReviewing ? 'フリーランサーを評価' : 'クライアントを評価'}
            </h1>
            <p className="text-gray-600">
              {targetUser}さんとのお取引はいかがでしたか？
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 総合評価 */}
            <div className="text-center">
              <label className="block text-lg font-semibold text-gray-900 mb-4">総合評価</label>
              <div className="flex items-center justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData(prev => ({ ...prev, overall: star }))}
                    className={`text-4xl transition-colors duration-200 ${
                      star <= reviewData.overall ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-gray-600">
                {reviewData.overall === 5 ? '非常に満足' :
                 reviewData.overall === 4 ? '満足' :
                 reviewData.overall === 3 ? '普通' :
                 reviewData.overall === 2 ? 'やや不満' : '不満'}
              </p>
            </div>

            {/* 詳細評価 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* コミュニケーション */}
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">コミュニケーション</label>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData(prev => ({ ...prev, communication: star }))}
                      className={`text-2xl transition-colors duration-200 ${
                        star <= reviewData.communication ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">レスポンスの速さ・丁寧さ</p>
              </div>

              {/* 品質 */}
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isClientReviewing ? '成果物の品質' : '案件の明確さ'}
                </label>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData(prev => ({ ...prev, quality: star }))}
                      className={`text-2xl transition-colors duration-200 ${
                        star <= reviewData.quality ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {isClientReviewing ? '期待通りの成果物' : '要件の明確さ'}
                </p>
              </div>

              {/* 時間管理 */}
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">時間管理</label>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData(prev => ({ ...prev, timeliness: star }))}
                      className={`text-2xl transition-colors duration-200 ${
                        star <= reviewData.timeliness ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">納期・スケジュール管理</p>
              </div>
            </div>

            {/* コメント */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                レビューコメント <span className="text-red-500">*</span>
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={6}
                required
                value={reviewData.comment}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`${targetUser}さんとのお取引について、具体的な感想をお聞かせください。良かった点や改善点があれば詳しく教えてください。`}
              />
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-center space-x-4 pt-8">
              <Link
                href="/profile"
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={submitting || !reviewData.comment.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    投稿中...
                  </div>
                ) : (
                  'レビューを投稿'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// サーバーサイドでセッション確認
export async function getServerSideProps(context) {
  const session = await getSession(context)
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: { session },
  }
}
