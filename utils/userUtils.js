// 簡易ユーザー管理システム（localStorage基盤）
import { hashPassword, verifyPassword, checkPasswordStrength } from './passwordUtils'

// ユーザーデータ構造:
// {
//   id: string,           // ユーザーID
//   email: string,        // メールアドレス（一意）
//   password: string,     // ハッシュ化されたパスワード
//   name: string,         // 表示名
//   userType: string,     // 'client' | 'freelancer'
//   createdAt: string,    // 登録日時
//   profile: {
//     bio: string,        // 自己紹介
//     skills: string[],   // スキル
//     location: string    // 所在地
//   }
// }

// ユーザーデータの取得
export const getUsers = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('crowdwork_users');
  return data ? JSON.parse(data) : [];
};

// ユーザーデータの保存
export const saveUsers = (users) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('crowdwork_users', JSON.stringify(users));
};

// 新規ユーザー登録（ハッシュ化対応）
export const registerUser = async (userData) => {
  const users = getUsers();
  
  // メールアドレスの重複チェック
  const existingUser = users.find(user => user.email === userData.email);
  if (existingUser) {
    throw new Error('このメールアドレスは既に登録されています');
  }
  
  // パスワード強度チェック
  const passwordCheck = checkPasswordStrength(userData.password);
  if (!passwordCheck.isValid) {
    throw new Error(passwordCheck.messages.join('、'));
  }
  
  // パスワードをハッシュ化
  const hashedPassword = await hashPassword(userData.password);
  
  // 新しいユーザーデータを作成
  const newUser = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    email: userData.email,
    password: hashedPassword, // ハッシュ化されたパスワード
    name: userData.name,
    userType: userData.userType || 'freelancer',
    createdAt: new Date().toISOString(),
    profile: {
      bio: userData.bio || '',
      skills: userData.skills || [],
      location: userData.location || ''
    }
  };
  
  // ユーザーリストに追加
  users.push(newUser);
  saveUsers(users);
  
  console.log('ユーザー登録成功:', newUser.email);
  return { 
    success: true, 
    user: { 
      id: newUser.id, 
      email: newUser.email, 
      name: newUser.name,
      userType: newUser.userType 
    } 
  };
};

// ユーザーログイン（ハッシュ化対応）
export const loginUser = async (email, password) => {
  const users = getUsers();
  
  // ユーザー検索
  const user = users.find(u => u.email === email);
  if (!user) {
    throw new Error('メールアドレスまたはパスワードが間違っています');
  }
  
  // パスワード照合
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('メールアドレスまたはパスワードが間違っています');
  }
  
  console.log('ログイン成功:', user.email);
  return { 
    success: true, 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      userType: user.userType 
    } 
  };
};

// パスワード変更
export const changePassword = async (userId, currentPassword, newPassword) => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('ユーザーが見つかりません');
  }
  
  // 現在のパスワード確認
  const isCurrentPasswordValid = await verifyPassword(currentPassword, users[userIndex].password);
  if (!isCurrentPasswordValid) {
    throw new Error('現在のパスワードが間違っています');
  }
  
  // 新しいパスワードの強度チェック
  const passwordCheck = checkPasswordStrength(newPassword);
  if (!passwordCheck.isValid) {
    throw new Error(passwordCheck.messages.join('、'));
  }
  
  // 新しいパスワードをハッシュ化
  const hashedNewPassword = await hashPassword(newPassword);
  
  // パスワード更新
  users[userIndex].password = hashedNewPassword;
  saveUsers(users);
  
  console.log('パスワード変更成功:', users[userIndex].email);
  return { success: true };
};

// ユーザー情報取得
export const getUserById = (userId) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return null;
  }
  
  // パスワードを除外して返す
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// ユーザーリスト取得（管理者用）
export const getAllUsers = () => {
  const users = getUsers();
  // パスワードを除外して返す
  return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
};

// プロフィール更新
export const updateUserProfile = (userId, profileData) => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('ユーザーが見つかりません');
  }
  
  // プロフィール更新
  users[userIndex] = {
    ...users[userIndex],
    name: profileData.name || users[userIndex].name,
    profile: {
      ...users[userIndex].profile,
      ...profileData.profile
    }
  };
  
  saveUsers(users);
  console.log('プロフィール更新成功:', users[userIndex].email);
  
  const { password, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword;
};

// バリデーション関数
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUserData = (userData) => {
  const errors = [];
  
  if (!userData.email || !validateEmail(userData.email)) {
    errors.push('有効なメールアドレスを入力してください');
  }
  
  if (!userData.password || userData.password.length < 8) {
    errors.push('パスワードは8文字以上である必要があります');
  }
  
  if (!userData.name || userData.name.trim().length === 0) {
    errors.push('名前を入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// テストユーザー初期化（開発用）
export const initializeTestUsers = async () => {
  if (typeof window === 'undefined') return;
  
  const users = getUsers();
  if (users.length === 0) {
    try {
      // テストユーザー1: クライアント
      await registerUser({
        email: 'client@test.com',
        password: 'ClientPass123!',
        name: 'テストクライアント',
        userType: 'client',
        bio: 'テスト用のクライアントアカウントです',
        location: '東京都'
      });
      
      // テストユーザー2: フリーランサー
      await registerUser({
        email: 'freelancer@test.com',
        password: 'FreelancerPass123!',
        name: 'テストフリーランサー',
        userType: 'freelancer',
        bio: 'テスト用のフリーランサーアカウントです',
        skills: ['JavaScript', 'React', 'Node.js'],
        location: '大阪府'
      });
      
      console.log('✅ テストユーザーを初期化しました（ハッシュ化対応）');
    } catch (error) {
      console.log('テストユーザー初期化スキップ:', error.message);
    }
  }
};

// 既存の平文パスワードをハッシュ化（移行用）
export const migratePasswordsToHash = async () => {
  if (typeof window === 'undefined') return;
  
  const users = getUsers();
  let migrationCount = 0;
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    // 平文パスワードかどうかをチェック（bcryptハッシュは$2で始まる）
    if (!user.password.startsWith('$2')) {
      try {
        console.log(`パスワード移行中: ${user.email}`);
        users[i].password = await hashPassword(user.password);
        migrationCount++;
      } catch (error) {
        console.error(`パスワード移行失敗 ${user.email}:`, error);
      }
    }
  }
  
  if (migrationCount > 0) {
    saveUsers(users);
    console.log(`✅ ${migrationCount}件のパスワードをハッシュ化しました`);
  } else {
    console.log('移行対象のパスワードはありませんでした');
  }
  
  return migrationCount;
};
