import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth-config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 個別案件取得 GET /api/jobs/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== 案件詳細API GET リクエスト開始 ===')
  console.log('取得する案件ID:', params.id)
  
  try {
    // セッション情報取得（ログイン状態の確認用）
    const session = await getServerSession(authOptions)
    console.log('セッション情報:', session ? '認証済み' : '未認証')

    // 案件IDのバリデーション
    if (!params.id) {
      console.log('バリデーションエラー: 案件IDが指定されていません')
      return NextResponse.json(
        { error: '案件IDが必要です' },
        { status: 400 }
      )
    }

    // UUIDの形式チェック（Supabaseの主キーはUUID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      console.log('バリデーションエラー: 無効な案件ID形式')
      return NextResponse.json(
        { error: '無効な案件IDです' },
        { status: 400 }
      )
    }

    console.log('Supabaseから案件データを取得中...')

    // Supabaseから指定されたIDの案件を取得
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .single() // single()で1件のみ取得

    if (error) {
      console.error('Supabaseクエリエラー:', error)
      
      // 案件が見つからない場合の特別なハンドリング
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '案件が見つかりません' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'データの取得に失敗しました', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      console.log('案件データが見つかりません')
      return NextResponse.json(
        { error: '案件が見つかりません' },
        { status: 404 }
      )
    }

    console.log('案件データ取得成功:', {
      id: data.id,
      title: data.title,
      status: data.status
    })

    // 成功レスポンス
    return NextResponse.json({
      job: data,
      message: '案件の取得に成功しました'
    })

  } catch (error) {
    console.error('案件詳細API GETエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 案件更新 PUT /api/jobs/[id] (投稿者のみ)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== 案件更新API PUT リクエスト開始 ===')
  console.log('更新する案件ID:', params.id)
  
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('認証エラー: セッションが見つかりません')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    console.log('認証済みユーザー:', session.user.email)

    // 案件IDのバリデーション
    if (!params.id) {
      return NextResponse.json(
        { error: '案件IDが必要です' },
        { status: 400 }
      )
    }

    // 既存の案件を取得して投稿者チェック
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingJob) {
      console.log('案件取得エラー:', fetchError)
      return NextResponse.json(
        { error: '案件が見つかりません' },
        { status: 404 }
      )
    }

    // 投稿者チェック
    if (existingJob.client_email !== session.user.email) {
      console.log('権限エラー: 投稿者以外からの更新要求')
      return NextResponse.json(
        { error: 'この案件を編集する権限がありません' },
        { status: 403 }
      )
    }

    // リクエストボディの取得
    const body = await request.json()
    console.log('更新データ:', body)

    const {
      title,
      description,
      budget,
      category,
      deadline,
      experience_level,
      skills,
      status
    } = body

    // 更新データの準備
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (budget !== undefined) updateData.budget = parseInt(budget)
    if (category !== undefined) updateData.category = category
    if (deadline !== undefined) updateData.deadline = deadline
    if (experience_level !== undefined) updateData.experience_level = experience_level
    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills) ? JSON.stringify(skills) : skills
    }
    if (status !== undefined) updateData.status = status

    console.log('実際の更新データ:', updateData)

    // Supabaseで案件を更新
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', params.id)
      .select()

    if (error) {
      console.error('Supabase更新エラー:', error)
      return NextResponse.json(
        { error: 'データの更新に失敗しました', details: error.message },
        { status: 500 }
      )
    }

    console.log('案件更新成功:', data)

    return NextResponse.json({
      message: '案件が正常に更新されました',
      job: data[0]
    })

  } catch (error) {
    console.error('案件更新API PUTエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 案件削除 DELETE /api/jobs/[id] (投稿者のみ)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== 案件削除API DELETE リクエスト開始 ===')
  console.log('削除する案件ID:', params.id)
  
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('認証エラー: セッションが見つかりません')
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    console.log('認証済みユーザー:', session.user.email)

    // 案件IDのバリデーション
    if (!params.id) {
      return NextResponse.json(
        { error: '案件IDが必要です' },
        { status: 400 }
      )
    }

    // 既存の案件を取得して投稿者チェック
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingJob) {
      console.log('案件取得エラー:', fetchError)
      return NextResponse.json(
        { error: '案件が見つかりません' },
        { status: 404 }
      )
    }

    // 投稿者チェック
    if (existingJob.client_email !== session.user.email) {
      console.log('権限エラー: 投稿者以外からの削除要求')
      return NextResponse.json(
        { error: 'この案件を削除する権限がありません' },
        { status: 403 }
      )
    }

    console.log('案件削除を実行中...')

    // Supabaseから案件を削除
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Supabase削除エラー:', error)
      return NextResponse.json(
        { error: 'データの削除に失敗しました', details: error.message },
        { status: 500 }
      )
    }

    console.log('案件削除成功')

    return NextResponse.json({
      message: '案件が正常に削除されました'
    })

  } catch (error) {
    console.error('案件削除API DELETEエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
