// utils/passwordUtils.js - パスワードハッシュ化ユーティリティ
import bcrypt from 'bcryptjs'

/**
 * パスワードをハッシュ化する
 * @param {string} password - 平文パスワード
 * @returns {Promise<string>} - ハッシュ化されたパスワード
 */
export const hashPassword = async (password) => {
  try {
    // saltRounds: 12 (セキュリティレベル高)
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    console.log('パスワードハッシュ化成功')
    return hashedPassword
  } catch (error) {
    console.error('パスワードハッシュ化エラー:', error)
    throw new Error('パスワードのハッシュ化に失敗しました')
  }
}

/**
 * パスワードを照合する
 * @param {string} password - 入力された平文パスワード
 * @param {string} hashedPassword - 保存されているハッシュ化パスワード
 * @returns {Promise<boolean>} - パスワードが一致するかどうか
 */
export const verifyPassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword)
    console.log('パスワード照合結果:', isMatch ? '一致' : '不一致')
    return isMatch
  } catch (error) {
    console.error('パスワード照合エラー:', error)
    throw new Error('パスワードの照合に失敗しました')
  }
}

/**
 * パスワード強度をチェックする
 * @param {string} password - チェックするパスワード
 * @returns {object} - 強度チェック結果
 */
export const checkPasswordStrength = (password) => {
  const result = {
    isValid: false,
    strength: 'weak',
    messages: []
  }

  // 最小長度チェック
  if (password.length < 8) {
    result.messages.push('パスワードは8文字以上である必要があります')
    return result
  }

  // 文字種類チェック
  const hasLowerCase = /[a-z]/.test(password)
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  let score = 0
  if (hasLowerCase) score++
  if (hasUpperCase) score++
  if (hasNumbers) score++
  if (hasSymbols) score++

  // 強度判定
  if (score >= 3) {
    result.isValid = true
    result.strength = score === 4 ? 'strong' : 'medium'
    result.messages.push('パスワード強度は十分です')
  } else {
    result.messages.push('大文字、小文字、数字、記号のうち3種類以上を含めてください')
  }

  return result
}

/**
 * 安全なランダムパスワードを生成する
 * @param {number} length - パスワードの長さ（デフォルト: 12）
 * @returns {string} - 生成されたパスワード
 */
export const generateSecurePassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  
  return password
}