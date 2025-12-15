import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const media = await prisma.media.findMany({
    include: { hotspots: true },
    orderBy: { order: 'asc' }
  })
  return NextResponse.json(media)
}

export async function POST(request: Request) {
  const body = await request.json()
  const media = await prisma.media.create({
    data: {
      type: body.type,
      filename: body.filename,
      path: body.path,
      title: body.title,
      description: body.description,
      order: body.order || 0
    }
  })
  return NextResponse.json(media)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }
  await prisma.media.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
