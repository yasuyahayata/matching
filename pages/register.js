import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { registerUser } from '../utils/userUtils'

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    userType: 'freelancer',
    bio: '',
    skills: '',
    location: ''
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
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // メールアドレス検証
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // パスワード検証
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上である必要があります';
    }

    // パスワード確認
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    // 名前検証
    if (!formData.name) {
      newErrors.name = '名前を入力してください';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // スキルを配列に変換
      const skillsArray = formData.skills
        ? formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
        : [];

      // ユーザー登録（async/await対応）
      const result = await registerUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        userType: formData.userType,
        bio: formData.bio,
        skills: skillsArray,
        location: formData.location
      });

      console.log('新規ユーザー登録成功:', result);
      
      // 登録成功後、ログインページにリダイレクト
      alert('アカウントが作成されました！ログインしてください。');
      router.push('/login');
      
    } catch (error) {
      console.error('登録エラー:', error);
      setErrors({ 
        submit: error.message || 'アカウント作成に失敗しました。もう一度お試しください。' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CrowdWork MVP
          </Link>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            新規アカウント作成
          </h2>
          <p className="mt-2 text-gray-600">
            あなたのプロフェッショナルな旅を始めましょう
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* メールアドレス */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス *
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
              パスワード *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="8文字以上の安全なパスワード"
              required
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            <p className="mt-1 text-xs text-gray-500">
              大文字、小文字、数字、記号のうち3種類以上を含めてください
            </p>
          </div>

          {/* パスワード確認 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（確認）*
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="パスワードを再入力"
              required
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          {/* 名前 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              表示名 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="山田太郎"
              required
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* ユーザータイプ */}
          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
              アカウントタイプ *
            </label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="freelancer">フリーランサー</option>
              <option value="client">クライアント</option>
            </select>
          </div>

          {/* 自己紹介 */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              自己紹介
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="あなたの経験やスキルについて簡潔に教えてください"
            />
          </div>

          {/* スキル（フリーランサーの場合） */}
          {formData.userType === 'freelancer' && (
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                スキル
              </label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="JavaScript, React, Node.js（カンマ区切り）"
              />
              <p className="mt-1 text-xs text-gray-500">
                スキルをカンマ区切りで入力してください
              </p>
            </div>
          )}

          {/* 所在地 */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              所在地
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="東京都"
            />
          </div>

          {/* エラーメッセージ */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : 'アカウントを作成'}
          </button>

          {/* ログインリンク */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              既にアカウントをお持ちですか？{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                ログイン
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
