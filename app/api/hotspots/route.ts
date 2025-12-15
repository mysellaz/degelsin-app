import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.json()
  const hotspot = await prisma.hotspot.create({
    data: {
      mediaId: body.mediaId,
      x: body.x,
      y: body.y,
      audioPath: body.audioPath,
      comment: body.comment
    }
  })
  return NextResponse.json(hotspot)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }
  await prisma.hotspot.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
