import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ユーティリティ関数
const getJobs = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('crowdwork_jobs');
  return data ? JSON.parse(data) : [];
};

const getApplications = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('crowdwork_applications');
  return data ? JSON.parse(data) : [];
};

const saveApplications = (applications) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('crowdwork_applications', JSON.stringify(applications));
};

export default function JobDetail() {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposalText, setProposalText] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // 金額を正しくフォーマットする関数
  const formatBudget = (budget) => {
    if (!budget) return '要相談'
    
    // 既に正しい形式の場合はそのまま返す
    if (typeof budget === 'string' && budget.includes('¥') && !budget.includes('¥¥')) {
      return budget
    }
    
    // 数値や文字列から¥と円を除去して数値部分のみ取得
    const numericValue = budget.toString().replace(/[¥,円]/g, '')
    
    // 数値でない場合は元の値を返す
    if (isNaN(numericValue)) return budget
    
    // 3桁区切りで表示
    return `¥${parseInt(numericValue).toLocaleString()}`
  }

  useEffect(() => {
    if (!id) return;

    const loadJob = () => {
      try {
        const jobs = getJobs();
        const currentJob = jobs.find(j => String(j.id) === String(id));
        
        if (!currentJob) {
          console.error('案件が見つかりません:', id);
          return;
        }

        setJob(currentJob);

        // 既に応募しているかチェック
        const applications = getApplications();
        const userEmail = session?.user?.email || 'freelancer1@example.com';
        const existingApplication = applications.find(app => 
          String(app.jobId) === String(id) && app.applicantEmail === userEmail
        );
        
        setHasApplied(!!existingApplication);
        setLoading(false);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        setLoading(false);
      }
    };

    loadJob();
  }, [id, session]);

  const handleApply = async () => {
    if (!proposalText.trim()) {
      alert('提案内容を入力してください');
      return;
    }

    try {
      setIsApplying(true);

      const applications = getApplications();
      const userEmail = session?.user?.email || 'freelancer1@example.com';
      
      // 重複応募チェック
      const existingApplication = applications.find(app => 
        String(app.jobId) === String(id) && app.applicantEmail === userEmail
      );

      if (existingApplication) {
        alert('既にこの案件に応募済みです');
        setHasApplied(true);
        return;
      }

      const newApplication = {
        id: Date.now().toString(),
        jobId: id,
        jobTitle: job.title,
        applicantEmail: userEmail,
        applicantName: session?.user?.name || 'ユーザー名未設定',
        proposalText: proposalText.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const updatedApplications = [...applications, newApplication];
      saveApplications(updatedApplications);

      setHasApplied(true);
      setProposalText('');
      alert('応募が完了しました！');

    } catch (error) {
      console.error('応募エラー:', error);
      alert('応募に失敗しました');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">案件が見つかりません</h1>
          <Link 
            href="/"
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            案件一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  // クライアント情報の安全な取得
  const getClientInfo = () => {
    const clientId = job.clientId || job.clientEmail || 'client@example.com';
    const clientName = job.clientName || clientId.split('@')[0] || 'クライアント';
    const clientInitial = clientName.charAt(0).toUpperCase();
    
    return { clientId, clientName, clientInitial };
  };

  const { clientId, clientName, clientInitial } = getClientInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← 案件一覧に戻る
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-xl p-8">
              {/* カテゴリバッジ */}
              <div className="mb-6">
                <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                  {job.category}
                </span>
              </div>

              {/* タイトル */}
              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                {job.title}
              </h1>

              {/* 基本情報 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">予算</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatBudget(job.budget)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">期限</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {job.deadline ? new Date(job.deadline).toLocaleDateString('ja-JP') : '要相談'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">提案数</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {job.proposals || 0}件
                  </p>
                </div>
              </div>

              {/* 説明 */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">案件の詳細</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* 必要スキル */}
              {job.skills && job.skills.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">必要なスキル</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* クライアント情報 */}
              <div className="border-t pt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">クライアント情報</h2>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                    {clientInitial}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{clientName}</p>
                    <p className="text-gray-600 text-sm">{clientId}</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  案件投稿日: {new Date(job.createdAt).toLocaleDateString('ja-JP')}
                </p>
              </div>

              {/* 管理者用リンク */}
              {session && (job.clientId === session.user?.email || job.clientEmail === session.user?.email) && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">管理者メニュー</h3>
                  <Link
                    href={`/job/${id}/applicants`}
                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    応募者を管理する
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* サイドバー */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-xl p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">この案件に応募する</h3>
              
              {hasApplied ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="text-green-600 font-semibold mb-2">応募済み</p>
                  <p className="text-gray-600 text-sm mb-4">この案件には既に応募済みです</p>
                  <Link
                    href="/my-applications"
                    className="block w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-center"
                  >
                    応募履歴を見る
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      提案内容 *
                    </label>
                    <textarea
                      value={proposalText}
                      onChange={(e) => setProposalText(e.target.value)}
                      placeholder="この案件に対するあなたの提案や経験をアピールしてください..."
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      disabled={isApplying}
                    />
                  </div>
                  
                  <button
                    onClick={handleApply}
                    disabled={isApplying || !proposalText.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    {isApplying ? '応募中...' : '応募する'}
                  </button>
                  
                  <p className="text-gray-600 text-xs mt-3 text-center">
                    応募すると、クライアントにあなたの提案が送信されます
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}