import { Inter } from 'next/font/google'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../lib/auth-config'
import SessionProvider from '../components/SessionProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'クラウドソーシングプラットフォーム',
  description: 'プロフェッショナルなフリーランサーと企業をつなぐ次世代のワークプラットフォーム',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="ja">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-14">
                  <div className="flex items-center">
                    <a href="/" className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-lg font-bold text-blue-600">CrowdPlatform</span>
                    </a>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {session ? (
                      <>
                        <a
                          href="/jobs"
                          className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          案件一覧
                        </a>
                        <a
                          href="/post-job"
                          className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          案件投稿
                        </a>
                        <a
                          href="/my-jobs"
                          className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          マイ案件
                        </a>
                        <div className="flex items-center space-x-2 border-l border-gray-200 pl-3 ml-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <span className="text-xs text-gray-700 max-w-20 truncate">
                              {session.user?.name || session.user?.email?.split('@')[0]}
                            </span>
                          </div>
                          <a
                            href="/api/auth/signout"
                            className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700 transition-colors"
                          >
                            ログアウト
                          </a>
                        </div>
                      </>
                    ) : (
                      <>
                        <a
                          href="/auth/signin"
                          className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          ログイン
                        </a>
                        <a
                          href="/auth/signup"
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          新規登録
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </nav>
            
            <main className="flex-1">
              {children}
            </main>
            
            <footer className="bg-gray-800 text-white">
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold">CrowdPlatform</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">
                      プロフェッショナルなフリーランサーと企業をつなぐ次世代のワークプラットフォーム
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-3">サービス</h4>
                    <ul className="space-y-1 text-gray-300">
                      <li><a href="/jobs" className="text-xs hover:text-white transition-colors">案件を探す</a></li>
                      <li><a href="/post-job" className="text-xs hover:text-white transition-colors">案件を投稿</a></li>
                      <li><a href="/how-it-works" className="text-xs hover:text-white transition-colors">使い方</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-3">サポート</h4>
                    <ul className="space-y-1 text-gray-300">
                      <li><a href="/help" className="text-xs hover:text-white transition-colors">ヘルプ</a></li>
                      <li><a href="/contact" className="text-xs hover:text-white transition-colors">お問い合わせ</a></li>
                      <li><a href="/terms" className="text-xs hover:text-white transition-colors">利用規約</a></li>
                      <li><a href="/privacy" className="text-xs hover:text-white transition-colors">プライバシーポリシー</a></li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <p className="text-center text-gray-400 text-xs">
                    © 2024 CrowdPlatform. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
