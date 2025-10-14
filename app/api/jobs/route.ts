import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth-config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  console.log('=== Jobs API GET リクエスト開始 ===')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('セッション情報:', session ? '認証済み' : '未認証')

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabaseクエリエラー:', error)
      return NextResponse.json(
        { error: 'データの取得に失敗しました', details: error.message },
        { status: 500 }
      )
    }

    console.log(`取得した案件数: ${data?.length || 0}`)
    
    return NextResponse.json({
      jobs: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Jobs API GETエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('=== Jobs API POST リクエスト開始 ===')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('認証エラー: セッションが見つかりません')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    console.log('認証済みユーザー:', session.user.email)

    const body = await request.json()
    console.log('リクエストボディ:', body)

    const {
      title,
      description,
      budget,
      category,
      deadline,
      experience_level,
      skills
    } = body

    // 必須フィールドの検証
    if (!title || !description || !budget || !category) {
      console.log('バリデーションエラー: 必須フィールドが不足')
      return NextResponse.json(
        { error: 'タイトル、説明、予算、カテゴリは必須です' },
        { status: 400 }
      )
    }

    // スキルが配列の場合はJSON文字列に変換
    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : skills

    const jobData = {
      title,
      description,
      budget: parseInt(budget),
      category,
      deadline: deadline || null,
      experience_level: experience_level || 'intermediate',
      skills: skillsJson,
      client_email: session.user.email,
      status: 'open'
    }

    console.log('挿入データ:', jobData)

    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()

    if (error) {
      console.error('Supabase挿入エラー:', error)
      return NextResponse.json(
        { error: 'データの保存に失敗しました', details: error.message },
        { status: 500 }
      )
    }

    console.log('案件作成成功:', data)

    return NextResponse.json({
      message: '案件が正常に作成されました',
      job: data[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Jobs API POSTエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
