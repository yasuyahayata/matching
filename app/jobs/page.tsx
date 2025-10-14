'use client'

import { useState, useEffect } from 'react'
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

export default function JobsPage() {
  const { data: session } = useSession()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (!response.ok) {
        throw new Error('案件の取得に失敗しました')
      }
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('案件取得エラー:', error)
      setError('案件の取得に失敗しました')
    } finally {
      setLoading(false)
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
      month: 'short',
      day: 'numeric'
    })
  }

  const formatBudget = (budget: number) => {
    return budget.toLocaleString('ja-JP') + '円'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">案件を取得中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">案件一覧</h1>
          {session && (
            <Link
              href="/post-job"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              新規案件投稿
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">案件がありません</h3>
            <p className="mt-1 text-sm text-gray-500">最初の案件を投稿してみましょう。</p>
            {session && (
              <div className="mt-6">
                <Link
                  href="/post-job"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  案件を投稿
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate mr-2">
                    {job.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'open' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status === 'open' ? '募集中' : '終了'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {job.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-semibold text-blue-600">{formatBudget(job.budget)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <span>{job.category}</span>
                  </div>

                  {job.deadline && (
                    <div className="flex items-center text-sm text-gray-500">
                      <span>締切: {formatDate(job.deadline)}</span>
                    </div>
                  )}
                </div>

                {parseSkills(job.skills).length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {parseSkills(job.skills).slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {parseSkills(job.skills).length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          +{parseSkills(job.skills).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    {formatDate(job.created_at)}
                  </span>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    詳細を見る →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
