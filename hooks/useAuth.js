import React, { useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/router"

export function useAuth(redirectTo) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const loading = status === "loading"
  const authenticated = !!session

  useEffect(() => {
    if (!loading && !authenticated && redirectTo) {
      router.push(redirectTo)
    }
  }, [loading, authenticated, redirectTo, router])

  return {
    user: session?.user,
    loading,
    authenticated,
    signIn,
    signOut: () => signOut({ callbackUrl: '/' }),
  }
}

export function withAuth(WrappedComponent, redirectTo = "/auth/signin") {
  return function AuthenticatedComponent(props) {
    const { loading, authenticated } = useAuth(redirectTo)

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!authenticated) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
