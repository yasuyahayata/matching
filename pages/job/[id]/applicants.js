import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// ユーティリティ関数をインライン定義（確実に動作するように）
const getApplications = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('crowdwork_applications');
  return data ? JSON.parse(data) : [];
};

const updateApplications = (applications) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('crowdwork_applications', JSON.stringify(applications));
};

const getJobs = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('crowdwork_jobs');
  return data ? JSON.parse(data) : [];
};

const updateJobs = (jobs) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('crowdwork_jobs', JSON.stringify(jobs));
};

export default function JobApplicants() {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // データ読み込み
  useEffect(() => {
    if (!id) return;

    const loadData = () => {
      try {
        // 案件データ取得（ID型不整合対応）
        const jobs = getJobs();
        const currentJob = jobs.find(j => String(j.id) === String(id));
        
        if (!currentJob) {
          console.error('案件が見つかりません:', id);
          return;
        }

        setJob(currentJob);

        // 応募データ取得（ID型不整合対応）
        const allApplications = getApplications();
        const jobApplications = allApplications.filter(app => String(app.jobId) === String(id));
        
        console.log('読み込んだ応募データ:', jobApplications);
        setApplications(jobApplications);
        setLoading(false);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // 承認処理
  const handleApprove = async (applicationId) => {
    console.log('承認処理開始 - applicationId:', applicationId);
    
    try {
      setLoading(true);

      // 現在のデータを取得
      const allApplications = getApplications();
      const allJobs = getJobs();

      console.log('承認前のデータ:', { allApplications, allJobs });

      // 対象の応募を承認に変更
      const updatedApplications = allApplications.map(app => {
        if (app.id === applicationId) {
          console.log('承認対象:', app);
          return { ...app, status: 'approved' };
        }
        // 同じ案件の他の応募を自動却下（ID型不整合対応）
        if (String(app.jobId) === String(id) && app.id !== applicationId) {
          console.log('自動却下対象:', app);
          return { ...app, status: 'rejected' };
        }
        return app;
      });

      // 案件ステータスを「進行中」に変更
      const updatedJobs = allJobs.map(job => {
        if (String(job.id) === String(id)) {
          console.log('案件ステータス更新:', job);
          return { ...job, status: 'in_progress' };
        }
        return job;
      });

      // データ保存
      updateApplications(updatedApplications);
      updateJobs(updatedJobs);

      console.log('更新後のデータ:', { updatedApplications, updatedJobs });

      // 状態更新
      const jobApplications = updatedApplications.filter(app => String(app.jobId) === String(id));
      setApplications(jobApplications);
      
      const updatedJob = updatedJobs.find(j => String(j.id) === String(id));
      setJob(updatedJob);

      alert('承認が完了しました！');
      
    } catch (error) {
      console.error('承認処理エラー:', error);
      alert('承認処理でエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 却下処理
  const handleReject = async (applicationId) => {
    console.log('却下処理開始 - applicationId:', applicationId);
    
    try {
      setLoading(true);

      const allApplications = getApplications();

      // 対象の応募を却下に変更
      const updatedApplications = allApplications.map(app => {
        if (app.id === applicationId) {
          console.log('却下対象:', app);
          return { ...app, status: 'rejected' };
        }
        return app;
      });

      // データ保存
      updateApplications(updatedApplications);

      // 状態更新
      const jobApplications = updatedApplications.filter(app => String(app.jobId) === String(id));
      setApplications(jobApplications);

      alert('却下が完了しました');
      
    } catch (error) {
      console.error('却下処理エラー:', error);
      alert('却下処理でエラーが発生しました');
    } finally {
      setLoading(false);
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
        <div className="text-xl text-red-600">案件が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link 
            href={`/job/${id}`}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← 案件詳細に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            応募者管理
          </h1>
          <h2 className="text-xl text-gray-600 mb-4">
            {job.title}
          </h2>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p><strong>案件ステータス:</strong> 
              <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
                job.status === 'active' ? 'bg-green-100 text-green-800' :
                job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.status === 'active' ? '募集中' :
                 job.status === 'in_progress' ? '進行中' : '完了'}
              </span>
            </p>
          </div>
        </div>

        {/* 応募者一覧 */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">
            応募者一覧 ({applications.length}名)
          </h3>

          {applications.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-xl text-center">
              <p className="text-gray-600">まだ応募者がいません</p>
            </div>
          ) : (
            applications.map((application) => (
              <div 
                key={application.id} 
                className="bg-white p-6 rounded-xl shadow-xl border-2 border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800">
                      {application.applicantName || 'ユーザー名未設定'}
                    </h4>
                    <p className="text-gray-600">
                      {application.applicantEmail || 'メール未設定'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                      application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'approved' ? 'bg-green-100 text-green-800' :
                      application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {application.status === 'pending' ? '審査中' :
                       application.status === 'approved' ? '承認済み' :
                       application.status === 'rejected' ? '却下済み' : application.status}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">提案内容：</h5>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {application.proposalText || '提案内容なし'}
                  </p>
                </div>

                <div className="mb-4 text-sm text-gray-500">
                  応募日時: {new Date(application.createdAt).toLocaleString('ja-JP')}
                </div>

                {/* アクションボタン - 審査中の場合のみ表示 */}
                {application.status === 'pending' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApprove(application.id)}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      {loading ? '処理中...' : '✅ 承認'}
                    </button>
                    <button
                      onClick={() => handleReject(application.id)}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      {loading ? '処理中...' : '❌ 却下'}
                    </button>
                  </div>
                )}

                {/* 処理済みの場合の表示 */}
                {application.status !== 'pending' && (
                  <div className="text-center py-2">
                    <span className="text-gray-500">
                      {application.status === 'approved' ? '✅ 承認済み' : '❌ 却下済み'}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* デバッグ情報（開発用） */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-bold mb-2">デバッグ情報:</h4>
          <p>案件ID: {id}</p>
          <p>応募数: {applications.length}</p>
          <p>案件ステータス: {job.status}</p>
          <button
            onClick={() => {
              console.log('現在のデータ:', {
                job,
                applications,
                allApplications: getApplications(),
                allJobs: getJobs()
              });
            }}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            コンソールにデータ出力
          </button>
        </div>
      </div>
    </div>
  );
}