import { NextResponse } from 'next/server'
import { pool } from '../../mysql'

export async function GET() {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                ID as id,
                Prompt as prompt,
                NegativePrompt as negativePrompt,
                Filename as filename,
                Width as width,
                Height as height,
                CreatedAt as createdAt
            FROM GenImg 
            WHERE ID IN (48, 55, 72, 79, 83, 91, 94, 143, 149, 158, 165, 170)`
        ) as [any[], any]

        // 转换为数组后排序
        const sortedRows = [...rows].sort((a, b) => {
            const order = [48, 55, 79, 91, 158, 72, 170, 143, 149, 94, 83, 165,]
            const indexA = order.indexOf(a.id)
            const indexB = order.indexOf(b.id)
            return indexA - indexB
        })

        return NextResponse.json(sortedRows)
    } catch (error) {
        console.error('获取示例图片失败:', error)
        return NextResponse.json(
            { error: '获取示例图片失败' },
            { status: 500 }
        )
    }
} 