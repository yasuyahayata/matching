'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  description: string
  budget: number
  category: string
  deadline: string | null
  experience_level: string
  skills: string
  client_email: string
  status: string
  created_at: string
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchJob(params.id as string)
    }
  }, [params.id])

  const fetchJob = async (id: string) => {
    console.log('案件詳細を取得中:', id)
    try {
      const response = await fetch(`/api/jobs/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '案件の取得に失敗しました')
      }

      console.log('取得した案件データ:', data.job)
      setJob(data.job)
    } catch (error) {
      console.error('案件取得エラー:', error)
      setError(error instanceof Error ? error.message : '案件の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!job || !window.confirm('本当にこの案件を削除しますか？')) {
      return
    }

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '案件の削除に失敗しました')
      }

      alert('案件を削除しました')
      router.push('/my-jobs')
    } catch (error) {
      console.error('案件削除エラー:', error)
      alert(error instanceof Error ? error.message : '案件の削除に失敗しました')
    } finally {
      setDeleteLoading(false)
    }
  }

  const parseSkills = (skillsString: string): string[] => {
    try {
      if (skillsString.startsWith('[')) {
        return JSON.parse(skillsString)
      }
      return skillsString.split(',').map(skill => skill.trim())
    } catch {
      return []
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatBudget = (budget: number) => {
    return budget.toLocaleString('ja-JP') + '円'
  }

  // ローディング表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">案件を取得中...</p>
          </div>
        </div>
      </div>
    )
  }

  // エラー表示
  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">エラーが発生しました</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6 space-x-3">
              <Link
                href="/jobs"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                案件一覧に戻る
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                再読み込み
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 投稿者かどうかの判定
  const isOwner = session?.user?.email === job.client_email

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* パンくずナビ */}
        <div className="mb-6">
          <Link
            href="/jobs"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            案件一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8">
            {/* ヘッダー部分 */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    job.status === 'open' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status === 'open' ? '募集中' : '終了'}
                  </span>
                  <span className="text-sm text-gray-500">
                    投稿日: {formatDate(job.created_at)}
                  </span>
                </div>
              </div>

              {/* 投稿者用のアクションボタン */}
              {isOwner && (
                <div className="flex space-x-2 ml-4">
                  <Link
                    href={`/jobs/${job.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    編集
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        削除中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        削除
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* 案件詳細 */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">案件詳細</h2>
                <div className="prose max-w-none text-gray-600">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>

              {/* サイドバー */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">案件情報</h3>
                  <div className="space-y-4">
                    {/* 予算 */}
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">予算</p>
                        <p className="text-lg font-bold text-blue-600">{formatBudget(job.budget)}</p>
                      </div>
                    </div>

                    {/* カテゴリ */}
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">カテゴリ</p>
                        <p className="text-sm text-gray-600">{job.category}</p>
                      </div>
                    </div>

                    {/* 経験レベル */}
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">経験レベル</p>
                        <p className="text-sm text-gray-600">{job.experience_level}</p>
                      </div>
                    </div>

                    {/* 締切 */}
                    {job.deadline && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">締切</p>
                          <p className="text-sm text-gray-600">{formatDate(job.deadline)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 必要スキル */}
                {parseSkills(job.skills).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">必要スキル</h3>
                    <div className="flex flex-wrap gap-2">
                      {parseSkills(job.skills).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 応募ボタン */}
                {session && job.status === 'open' && !isOwner && (
                  <div className="pt-4 border-t border-gray-200">
                    <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                      この案件に応募する
                    </button>
                  </div>
                )}

                {/* ログインしていない場合の表示 */}
                {!session && job.status === 'open' && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">応募するにはログインが必要です</p>
                    <Link
                      href="/auth/signin"
                      className="w-full block text-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      ログインして応募する
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
