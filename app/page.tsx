import { getServerSession } from 'next-auth/next'
import { authOptions } from '../lib/auth-config'
import Link from 'next/link'

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            クラウドソーシング
            <span className="text-blue-600">プラットフォーム</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            プロフェッショナルなフリーランサーと企業をつなぐ次世代のワークプラットフォーム
          </p>

          <div className="space-y-4 mb-12">
            {session ? (
              <div className="space-y-4">
                <p className="text-lg text-gray-700">
                  こんにちは、<span className="font-semibold text-blue-600">{session.user?.name || session.user?.email}</span>さん！
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    href="/jobs"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    案件を探す
                  </Link>
                  <Link
                    href="/post-job"
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    案件を投稿する
                  </Link>
                  <Link
                    href="/my-jobs"
                    className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    マイ案件
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-700 mb-6">
                  今すぐ登録して、あなたのスキルを活かしませんか？
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    href="/auth/signin"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    新規登録
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H8a2 2 0 00-2-2V6m8 0h2a2 2 0 012 2v6.5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">多様な案件</h3>
              <p className="text-gray-600 text-sm">
                Web開発、デザイン、マーケティングなど幅広い分野の案件から選択可能
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">安全な取引</h3>
              <p className="text-gray-600 text-sm">
                エスクロー機能により、安全で確実な報酬の受け取りを保証
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">スピーディー</h3>
              <p className="text-gray-600 text-sm">
                効率的なマッチングシステムにより、素早くプロジェクトを開始
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
