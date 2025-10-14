import NextAuth from "next-auth"
import { authOptions } from "../../../lib/auth-config"

export default NextAuth(authOptions)

// authOptions をエクスポート（既存のインポートとの互換性のため）
export { authOptions }
