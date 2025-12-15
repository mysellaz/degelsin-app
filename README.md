# degelsin-app
Interactive photo gallery with music hotspots for friends
# 🎵 DEGELSIN - Interactive Photo Gallery with Music Hotspots

## 🤖 CLAUDE CODE INSTRUCTIONS - READ THIS COMPLETELY

You are tasked with building a **complete Next.js application** from scratch. Follow these instructions **WITHOUT ASKING ANY QUESTIONS**. Just build everything step by step.

---

## 📋 PROJECT REQUIREMENTS

### What to Build:
A private photo gallery app where:
1. **Admin Panel**: Upload photos/videos, add interactive hotspots on images, attach music/audio files and comments to each hotspot
2. 2. **Public View**: Users browse photos, click hotspots to play music and read comments
   3. 3. **Database**: PostgreSQL for storing all data
      4. 4. **Deploy**: Must work on Railway with minimal resources
        
         5. ### Tech Stack (DO NOT CHANGE):
         6. - **Framework**: Next.js 14 (App Router)
            - - **Database**: PostgreSQL with Prisma ORM
              - - **UI**: Tailwind CSS + shadcn/ui
                - - **File Upload**: Direct to `/public/uploads`
                  - - **Audio Player**: react-h5-audio-player
                    - - **Auth**: Simple password protection (no complex auth)
                     
                      - ---

                      ## 🚀 STEP-BY-STEP BUILD INSTRUCTIONS

                      ### STEP 1: Initialize Project
                      ```bash
                      npx create-next-app@latest degelsin-app --typescript --tailwind --app --no-src-dir
                      cd degelsin-app
                      ```

                      ### STEP 2: Install Dependencies
                      ```bash
                      npm install @prisma/client prisma
                      npm install react-h5-audio-player
                      npm install react-image-marker
                      npm install sharp
                      npm install bcryptjs
                      npm install @types/bcryptjs --save-dev
                      ```

                      ### STEP 3: Setup Prisma
                      Create `prisma/schema.prisma`:
                      ```prisma
                      generator client {
                        provider = "prisma-client-js"
                      }

                      datasource db {
                        provider = "postgresql"
                        url      = env("DATABASE_URL")
                      }

                      model Media {
                        id          String   @id @default(cuid())
                        type        String   // "photo" or "video"
                        filename    String
                        path        String
                        title       String?
                        description String?
                        order       Int      @default(0)
                        hotspots    Hotspot[]
                        createdAt   DateTime @default(now())
                        updatedAt   DateTime @updatedAt
                      }

                      model Hotspot {
                        id       String  @id @default(cuid())
                        mediaId  String
                        media    Media   @relation(fields: [mediaId], references: [id], onDelete: Cascade)
                        x        Float   // X coordinate (percentage)
                        y        Float   // Y coordinate (percentage)
                        audioPath String?
                        comment  String?
                        createdAt DateTime @default(now())
                      }

                      model Admin {
                        id       String @id @default(cuid())
                        username String @unique
                        password String // hashed
                      }
                      ```

                      ### STEP 4: Environment Variables
                      Create `.env.local`:
                      ```env
                      DATABASE_URL="postgresql://postgres:password@localhost:5432/degelsin?schema=public"
                      ADMIN_PASSWORD="degelsin123"
                      ```

                      ### STEP 5: Initialize Database
                      ```bash
                      npx prisma generate
                      npx prisma db push
                      ```

                      ### STEP 6: Project Structure
                      Create this folder structure:
                      ```
                      app/
                      ├── admin/
                      │   ├── page.tsx (Admin dashboard)
                      │   ├── upload/page.tsx (Upload media)
                      │   └── edit/[id]/page.tsx (Edit hotspots)
                      ├── api/
                      │   ├── auth/route.ts
                      │   ├── media/route.ts
                      │   ├── hotspots/route.ts
                      │   └── upload/route.ts
                      ├── gallery/page.tsx (Public gallery)
                      ├── view/[id]/page.tsx (View single photo with hotspots)
                      ├── layout.tsx
                      └── page.tsx (Landing/Login)
                      components/
                      ├── ImageHotspotEditor.tsx
                      ├── AudioPlayer.tsx
                      ├── MediaUploader.tsx
                      └── GalleryGrid.tsx
                      lib/
                      ├── prisma.ts
                      ├── auth.ts
                      └── utils.ts
                      public/
                      └── uploads/ (create this folder)
                      ```

                      ### STEP 7: Core Files to Create

                      #### `lib/prisma.ts`
                      ```typescript
                      import { PrismaClient } from '@prisma/client'

                      const globalForPrisma = global as unknown as { prisma: PrismaClient }

                      export const prisma = globalForPrisma.prisma || new PrismaClient()

                      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
                      ```

                      #### `app/api/media/route.ts`
                      ```typescript
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
                      ```

                      #### `app/api/hotspots/route.ts`
                      ```typescript
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
                        await prisma.hotspot.delete({ where: { id: id! } })
                        return NextResponse.json({ success: true })
                      }
                      ```

                      #### `app/api/upload/route.ts`
                      ```typescript
                      import { NextResponse } from 'next/server'
                      import { writeFile } from 'fs/promises'
                      import path from 'path'

                      export async function POST(request: Request) {
                        const formData = await request.formData()
                        const file = formData.get('file') as File

                        if (!file) {
                          return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
                        }

                        const bytes = await file.arrayBuffer()
                        const buffer = Buffer.from(bytes)

                        const filename = `${Date.now()}-${file.name}`
                        const filepath = path.join(process.cwd(), 'public', 'uploads', filename)

                        await writeFile(filepath, buffer)

                        return NextResponse.json({
                          filename,
                          path: `/uploads/${filename}`
                        })
                      }
                      ```

                      #### `app/page.tsx` (Landing)
                      ```typescript
                      export default function Home() {
                        return (
                          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                            <div className="text-center text-white">
                              <h1 className="text-6xl font-bold mb-8">DE GELSIN</h1>
                              <p className="text-xl mb-8">Interactive Photo Gallery</p>
                              <div className="space-x-4">
                                <a href="/gallery" className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100">
                                  View Gallery
                                </a>
                                <a href="/admin" className="px-8 py-3 bg-transparent border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-purple-600">
                                  Admin Login
                                </a>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      ```

                      #### `app/admin/page.tsx`
                      ```typescript
                      'use client'
                      import { useState } from 'react'
                      import { useRouter } from 'next/navigation'

                      export default function AdminLogin() {
                        const [password, setPassword] = useState('')
                        const router = useRouter()

                        const handleLogin = () => {
                          if (password === 'degelsin123') {
                            localStorage.setItem('admin', 'true')
                            router.push('/admin/upload')
                          } else {
                            alert('Wrong password!')
                          }
                        }

                        return (
                          <div className="min-h-screen flex items-center justify-center bg-gray-100">
                            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                              <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
                              <input
                                type="password"
                                placeholder="Enter password"
                                className="w-full px-4 py-2 border rounded mb-4"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                              />
                              <button
                                onClick={handleLogin}
                                className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                              >
                                Login
                              </button>
                            </div>
                          </div>
                        )
                      }
                      ```

                      #### `app/admin/upload/page.tsx`
                      ```typescript
                      'use client'
                      import { useState } from 'react'

                      export default function UploadPage() {
                        const [uploading, setUploading] = useState(false)

                        const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
                          e.preventDefault()
                          setUploading(true)

                          const formData = new FormData(e.currentTarget)

                          // Upload file
                          const fileRes = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                          })
                          const fileData = await fileRes.json()

                          // Create media record
                          await fetch('/api/media', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              type: 'photo',
                              filename: fileData.filename,
                              path: fileData.path,
                              title: formData.get('title'),
                              description: formData.get('description')
                            })
                          })

                          setUploading(false)
                          alert('Uploaded successfully!')
                          window.location.reload()
                        }

                        return (
                          <div className="min-h-screen bg-gray-100 p-8">
                            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg">
                              <h1 className="text-3xl font-bold mb-6">Upload Media</h1>
                              <form onSubmit={handleUpload} className="space-y-4">
                                <input
                                  type="file"
                                  name="file"
                                  accept="image/*,video/*"
                                  required
                                  className="w-full"
                                />
                                <input
                                  type="text"
                                  name="title"
                                  placeholder="Title"
                                  className="w-full px-4 py-2 border rounded"
                                />
                                <textarea
                                  name="description"
                                  placeholder="Description"
                                  className="w-full px-4 py-2 border rounded"
                                />
                                <button
                                  type="submit"
                                  disabled={uploading}
                                  className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                                >
                                  {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                              </form>
                            </div>
                          </div>
                        )
                      }
                      ```

                      #### `app/gallery/page.tsx`
                      ```typescript
                      'use client'
                      import { useEffect, useState } from 'react'
                      import Image from 'next/image'
                      import Link from 'next/link'

                      export default function Gallery() {
                        const [media, setMedia] = useState<any[]>([])

                        useEffect(() => {
                          fetch('/api/media')
                            .then(res => res.json())
                            .then(setMedia)
                        }, [])

                        return (
                          <div className="min-h-screen bg-gray-100 p-8">
                            <h1 className="text-4xl font-bold text-center mb-8">Gallery</h1>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                              {media.map(item => (
                                <Link href={`/view/${item.id}`} key={item.id}>
                                  <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
                                    <Image
                                      src={item.path}
                                      alt={item.title || ''}
                                      width={400}
                                      height={300}
                                      className="w-full h-64 object-cover"
                                    />
                                    <div className="p-4">
                                      <h3 className="font-bold">{item.title}</h3>
                                      <p className="text-sm text-gray-600">{item.hotspots.length} hotspots</p>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )
                      }
                      ```

                      #### `app/view/[id]/page.tsx`
                      ```typescript
                      'use client'
                      import { useEffect, useState } from 'react'
                      import Image from 'next/image'
                      import AudioPlayer from 'react-h5-audio-player'
                      import 'react-h5-audio-player/lib/styles.css'

                      export default function ViewPhoto({ params }: { params: { id: string } }) {
                        const [media, setMedia] = useState<any>(null)
                        const [selectedHotspot, setSelectedHotspot] = useState<any>(null)

                        useEffect(() => {
                          fetch(`/api/media`)
                            .then(res => res.json())
                            .then(data => {
                              const item = data.find((m: any) => m.id === params.id)
                              setMedia(item)
                            })
                        }, [params.id])

                        if (!media) return <div>Loading...</div>

                        return (
                          <div className="min-h-screen bg-gray-100 p-8">
                            <div className="max-w-4xl mx-auto bg-white p-4 rounded-lg">
                              <h1 className="text-3xl font-bold mb-4">{media.title}</h1>
                              <div className="relative">
                                <Image
                                  src={media.path}
                                  alt={media.title}
                                  width={1200}
                                  height={800}
                                  className="w-full rounded-lg"
                                />
                                {media.hotspots.map((hotspot: any) => (
                                  <button
                                    key={hotspot.id}
                                    onClick={() => setSelectedHotspot(hotspot)}
                                    className="absolute w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg animate-pulse hover:scale-110 transition"
                                    style={{
                                      left: `${hotspot.x}%`,
                                      top: `${hotspot.y}%`,
                                      transform: 'translate(-50%, -50%)'
                                    }}
                                  />
                                ))}
                              </div>

                              {selectedHotspot && (
                                <div className="mt-6 p-4 bg-purple-100 rounded-lg">
                                  <h3 className="font-bold mb-2">Hotspot Info</h3>
                                  {selectedHotspot.comment && (
                                    <p className="mb-4">{selectedHotspot.comment}</p>
                                  )}
                                  {selectedHotspot.audioPath && (
                                    <AudioPlayer src={selectedHotspot.audioPath} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      ```

                      ---

                      ## 🎯 FINAL STEPS

                      ### Create missing folders:
                      ```bash
                      mkdir -p public/uploads
                      mkdir -p app/api/auth app/api/media app/api/hotspots app/api/upload
                      mkdir -p components lib
                      ```

                      ### Update `next.config.js`:
                      ```javascript
                      /** @type {import('next').NextConfig} */
                      const nextConfig = {
                        images: {
                          domains: ['localhost'],
                          unoptimized: true
                        },
                        experimental: {
                          serverActions: true
                        }
                      }

                      module.exports = nextConfig
                      ```

                      ### Run development:
                      ```bash
                      npm run dev
                      ```

                      ---

                      ## 🚀 DEPLOYMENT TO RAILWAY

                      ### 1. Create `railway.json`:
                      ```json
                      {
                        "$schema": "https://railway.app/railway.schema.json",
                        "build": {
                          "builder": "NIXPACKS"
                        },
                        "deploy": {
                          "startCommand": "npm run start",
                          "restartPolicyType": "ON_FAILURE",
                          "restartPolicyMaxRetries": 10
                        }
                      }
                      ```

                      ### 2. Add PostgreSQL on Railway:
                      - Go to Railway dashboard
                      - - Click "New" → "Database" → "PostgreSQL"
                        - - Copy DATABASE_URL
                         
                          - ### 3. Set Environment Variables on Railway:
                          - ```
                            DATABASE_URL=(paste from Railway)
                            ADMIN_PASSWORD=degelsin123
                            ```

                            ### 4. Deploy:
                            ```bash
                            git init
                            git add .
                            git commit -m "Initial commit"
                            git branch -M main
                            git remote add origin https://github.com/mysellaz/degelsin-app.git
                            git push -u origin main
                            ```

                            ### 5. Connect to Railway:
                            - Link GitHub repo to Railway
                            - - It will auto-deploy
                             
                              - ---

                              ## ✅ DONE!

                              The app should now be live with:
                              - ✅ Photo upload
                              - - ✅ Hotspot creation
                                - - ✅ Music playback
                                  - - ✅ Public gallery
                                    - - ✅ Admin panel
                                     
                                      - **Access:**
                                      - - Public: `https://your-app.railway.app/gallery`
                                        - - Admin: `https://your-app.railway.app/admin` (password: degelsin123)
                                         
                                          - ---

                                          ## 🤖 CLAUDE: BUILD ALL OF THIS WITHOUT ASKING QUESTIONS!
                                          Just execute step by step. If something doesn't work, fix it and continue.
