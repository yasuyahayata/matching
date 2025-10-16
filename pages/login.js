import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // メールアドレス検証
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください'
    }

    // パスワード検証
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setLoading(true)
      setErrors({})

      console.log('ログイン開始:', formData.email)

      // NextAuth経由でログイン（userUtils.jsの認証を内部で使用）
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      console.log('signIn結果:', result)

      if (result?.ok && !result?.error) {
        // セッション取得確認
        const session = await getSession()
        console.log('セッション取得成功:', session)
        
        // ホームページにリダイレクト  
        router.push('/')
      } else {
        const errorMessage = result?.error || 'ログインに失敗しました'
        console.error('ログインエラー:', errorMessage)
        throw new Error(`認証エラー: ${errorMessage}`)
      }
    } catch (error) {
      console.error('ログイン例外:', error)
      setErrors({ 
        submit: error.message || 'ログインに失敗しました。メールアドレスとパスワードを確認してください。' 
      })
    } finally {
      setLoading(false)
    }
  }

  // テストアカウントでのログイン
  const handleTestLogin = async (testType) => {
    const testCredentials = testType === 'client' 
      ? { email: 'client@test.com', password: 'ClientPass123!' }
      : { email: 'freelancer@test.com', password: 'FreelancerPass123!' }

    setFormData(testCredentials)
    
    try {
      setLoading(true)
      setErrors({})

      console.log('テストログイン開始:', testType)

      const result = await signIn('credentials', {
        email: testCredentials.email,
        password: testCredentials.password,
        redirect: false
      })

      if (result?.ok && !result?.error) {
        const session = await getSession()
        console.log('テストログインセッション:', session)
        router.push('/')
      } else {
        throw new Error(`テストログインに失敗しました: ${result?.error}`)
      }
    } catch (error) {
      console.error('テストログインエラー:', error)
      setErrors({ 
        submit: error.message 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CrowdWork MVP
          </Link>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            ログイン
          </h2>
          <p className="mt-2 text-gray-600">
            アカウントにサインインしてください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* メールアドレス */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your-email@example.com"
              required
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* パスワード */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="パスワードを入力"
              required
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* エラーメッセージ */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          {/* テストログインボタン */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600 text-center">テストアカウントでログイン:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTestLogin('client')}
                disabled={loading}
                className="bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                クライアント
              </button>
              <button
                type="button"
                onClick={() => handleTestLogin('freelancer')}
                disabled={loading}
                className="bg-orange-500 text-white py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                フリーランサー
              </button>
            </div>
          </div>

          {/* 新規登録リンク */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                新規登録
              </Link>
            </p>
          </div>

          {/* パスワードリセットリンク（将来実装予定） */}
          <div className="text-center">
            <Link href="#" className="text-sm text-gray-500 hover:text-gray-700">
              パスワードをお忘れですか？
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
