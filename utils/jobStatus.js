// 案件ステータス定義
export const JOB_STATUS = {
  RECRUITING: 'recruiting',      // 募集中
  IN_PROGRESS: 'in_progress',    // 進行中
  COMPLETED: 'completed',        // 完了
  CANCELLED: 'cancelled'         // キャンセル
}

// ステータス表示用のラベル
export const JOB_STATUS_LABELS = {
  [JOB_STATUS.RECRUITING]: '募集中',
  [JOB_STATUS.IN_PROGRESS]: '進行中',
  [JOB_STATUS.COMPLETED]: '完了',
  [JOB_STATUS.CANCELLED]: 'キャンセル'
}

// ステータス色の定義
export const JOB_STATUS_COLORS = {
  [JOB_STATUS.RECRUITING]: 'bg-green-100 text-green-800',
  [JOB_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [JOB_STATUS.COMPLETED]: 'bg-gray-100 text-gray-800',
  [JOB_STATUS.CANCELLED]: 'bg-red-100 text-red-800'
}

// 応募ステータス定義
export const APPLICATION_STATUS = {
  PENDING: 'pending',      // 審査中
  APPROVED: 'approved',    // 承認済み
  REJECTED: 'rejected'     // 却下
}

// 応募ステータス表示用のラベル
export const APPLICATION_STATUS_LABELS = {
  [APPLICATION_STATUS.PENDING]: '審査中',
  [APPLICATION_STATUS.APPROVED]: '承認済み',
  [APPLICATION_STATUS.REJECTED]: '却下'
}

// 応募ステータス色の定義
export const APPLICATION_STATUS_COLORS = {
  [APPLICATION_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [APPLICATION_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [APPLICATION_STATUS.REJECTED]: 'bg-red-100 text-red-800'
}

// ローカルストレージのキー
export const STORAGE_KEYS = {
  JOBS: 'crowdwork_jobs',
  APPLICATIONS: 'crowdwork_applications',
  REVIEWS: 'crowdwork_reviews',
  MESSAGES: 'crowdwork_messages',
  USER_PROFILE: 'crowdwork_user_profile'
}

// データの初期化・取得関数
export const getStoredData = (key, defaultValue = []) => {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error(`Error getting stored data for ${key}:`, error)
    return defaultValue
  }
}

// データの保存関数
export const setStoredData = (key, data) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error storing data for ${key}:`, error)
  }
}

// 案件のステータス更新関数
export const updateJobStatus = (jobId, newStatus, assignedFreelancer = null) => {
  const jobs = getStoredData(STORAGE_KEYS.JOBS, [])
  const updatedJobs = jobs.map(job => {
    if (job.id === jobId) {
      return {
        ...job,
        status: newStatus,
        assignedFreelancer,
        updatedAt: new Date().toISOString()
      }
    }
    return job
  })
  
  setStoredData(STORAGE_KEYS.JOBS, updatedJobs)
  return updatedJobs.find(job => job.id === jobId)
}

// 応募のステータス更新関数（修正版）
export const updateApplicationStatus = (jobId, userId, newStatus) => {
  const applications = getStoredData(STORAGE_KEYS.APPLICATIONS, [])
  
  // デバッグ用ログ
  console.log('応募ステータス更新:', { jobId, userId, newStatus })
  console.log('更新前の応募データ:', applications.filter(app => app.jobId === jobId))
  
  const updatedApplications = applications.map(app => {
    if (app.jobId === jobId && app.userId === userId) {
      console.log(`応募者 ${userId} のステータスを ${newStatus} に更新`)
      return {
        ...app,
        status: newStatus,
        updatedAt: new Date().toISOString()
      }
    }
    return app
  })
  
  // 更新後のデータをローカルストレージに保存
  setStoredData(STORAGE_KEYS.APPLICATIONS, updatedApplications)
  
  // デバッグ用ログ
  console.log('更新後の応募データ:', updatedApplications.filter(app => app.jobId === jobId))
  
  return updatedApplications.find(app => app.jobId === jobId && app.userId === userId)
}

// 複数の応募ステータスを一括更新する関数（新規追加）
export const bulkUpdateApplicationStatus = (jobId, statusUpdates) => {
  const applications = getStoredData(STORAGE_KEYS.APPLICATIONS, [])
  
  console.log('一括ステータス更新:', { jobId, statusUpdates })
  
  const updatedApplications = applications.map(app => {
    if (app.jobId === jobId) {
      const update = statusUpdates.find(upd => upd.userId === app.userId)
      if (update) {
        console.log(`応募者 ${app.userId} のステータスを ${update.newStatus} に更新`)
        return {
          ...app,
          status: update.newStatus,
          updatedAt: new Date().toISOString()
        }
      }
    }
    return app
  })
  
  setStoredData(STORAGE_KEYS.APPLICATIONS, updatedApplications)
  console.log('一括更新後の応募データ:', updatedApplications.filter(app => app.jobId === jobId))
  
  return updatedApplications.filter(app => app.jobId === jobId)
}

// 特定の案件の応募者一覧を取得
export const getJobApplications = (jobId) => {
  const applications = getStoredData(STORAGE_KEYS.APPLICATIONS, [])
  const jobApplications = applications.filter(app => app.jobId === jobId)
  console.log(`案件 ${jobId} の応募者:`, jobApplications)
  return jobApplications
}

// 特定ユーザーの応募一覧を取得  
export const getUserApplications = (userId) => {
  const applications = getStoredData(STORAGE_KEYS.APPLICATIONS, [])
  return applications.filter(app => app.userId === userId)
}
