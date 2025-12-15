'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Media {
  id: string
  type: string
  filename: string
  path: string
  title: string | null
  description: string | null
  hotspots: { id: string }[]
}

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [mediaList, setMediaList] = useState<Media[]>([])
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin') !== 'true') {
      router.push('/admin')
      return
    }
    fetchMedia()
  }, [router])

  const fetchMedia = async () => {
    const res = await fetch('/api/media')
    const data = await res.json()
    setMediaList(data)
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)

    const formData = new FormData(e.currentTarget)

    const fileRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const fileData = await fileRes.json()

    const file = formData.get('file') as File
    const isVideo = file.type.startsWith('video/')

    await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: isVideo ? 'video' : 'photo',
        filename: fileData.filename,
        path: fileData.path,
        title: formData.get('title'),
        description: formData.get('description')
      })
    })

    setUploading(false)
    fetchMedia()
    ;(e.target as HTMLFormElement).reset()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return
    await fetch(`/api/media?id=${id}`, { method: 'DELETE' })
    fetchMedia()
  }

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <div className="bg-white p-8 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Upload Media</h2>
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
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Media List ({mediaList.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mediaList.map(item => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <div className="relative h-48">
                  {item.type === 'video' ? (
                    <video src={item.path} className="w-full h-full object-cover" />
                  ) : (
                    <Image
                      src={item.path}
                      alt={item.title || ''}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold truncate">{item.title || 'Untitled'}</h3>
                  <p className="text-sm text-gray-500">{item.hotspots.length} hotspots</p>
                  <div className="flex gap-2 mt-2">
                    <a
                      href={`/admin/edit/${item.id}`}
                      className="flex-1 text-center px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Edit Hotspots
                    </a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {mediaList.length === 0 && (
            <p className="text-gray-500 text-center py-8">No media uploaded yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
