import { NextRequest, NextResponse } from 'next/server'
import Together from 'together-ai'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { pool, noStore } from '../mysql'

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY })

export async function POST(req: NextRequest) {
    try {
        const { prompt, negativePrompt, width, height } = await req.json()

        const response = await together.images.create({
            model: "black-forest-labs/FLUX.1-schnell-Free",
            // model: "black-forest-labs/FLUX.1-schnell",
            prompt,
            negative_prompt: negativePrompt,
            width,
            height,
            steps: 4,
            n: 1,
            response_format: "base64"
        })
        const now = new Date()
        // 日期字符串
        const dateString = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).replace(/[/: ]/g, '')
        // 时间字符串
        const timeString = now.toLocaleString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/[/: ]/g, '')

        const timestamp = dateString + '_' + timeString + '_' + now.getMilliseconds().toString().padStart(3, '0')
        const filename = `${timestamp}.jpg`
        const imagePath = join('/www', 'share', 'proj', 'GenImg', filename)
        const imageBuffer = Buffer.from(response.data[0].b64_json, 'base64')
        await writeFile(imagePath, imageBuffer)

        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = req.headers.get('user-agent') || 'unknown'

        // 使用MySQL连接池执行插入
        const [result] = await pool.execute(
            `INSERT INTO GenImg (
        CreatedAt, Prompt, Filename, Width, Height, 
        NegativePrompt, IP, UserAgent
      ) VALUES (
        NOW(), ?, ?, ?, ?, 
        ?, ?, ?
      )`,
            [prompt, filename, width, height, negativePrompt, ip, userAgent]
        )

        return NextResponse.json({
            id: (result as any).insertId,
            prompt,
            negativePrompt,
            filename,
            width,
            height
        })

    } catch (error) {
        console.error('生成图像失败:', error)
        return NextResponse.json(
            { error: '生成图像失败' },
            { status: 500 }
        )
    }
}
