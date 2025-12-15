'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

interface Hotspot {
  id: string
  x: number
  y: number
  audioPath: string | null
  comment: string | null
}

interface Media {
  id: string
  type: string
  path: string
  title: string | null
  hotspots: Hotspot[]
}

export default function EditHotspots() {
  const params = useParams()
  const router = useRouter()
  const imageRef = useRef<HTMLDivElement>(null)

  const [media, setMedia] = useState<Media | null>(null)
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [newComment, setNewComment] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin') !== 'true') {
      router.push('/admin')
      return
    }
    fetchMedia()
  }, [params.id, router])

  const fetchMedia = async () => {
    const res = await fetch('/api/media')
    const data = await res.json()
    const item = data.find((m: Media) => m.id === params.id)
    if (item) {
      setMedia(item)
      setHotspots(item.hotspots)
    }
  }

  const handleImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !media) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const res = await fetch('/api/hotspots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaId: media.id,
        x,
        y,
        audioPath: null,
        comment: null
      })
    })

    const newHotspot = await res.json()
    setHotspots([...hotspots, newHotspot])
    setSelectedHotspot(newHotspot)
  }

  const handleDeleteHotspot = async (id: string) => {
    await fetch(`/api/hotspots?id=${id}`, { method: 'DELETE' })
    setHotspots(hotspots.filter(h => h.id !== id))
    setSelectedHotspot(null)
  }

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedHotspot) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', e.target.files[0])

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()

    await fetch('/api/hotspots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaId: media?.id,
        x: selectedHotspot.x,
        y: selectedHotspot.y,
        audioPath: data.path,
        comment: selectedHotspot.comment
      })
    })

    await handleDeleteHotspot(selectedHotspot.id)
    fetchMedia()
    setUploading(false)
  }

  const handleSaveComment = async () => {
    if (!selectedHotspot || !media) return

    await handleDeleteHotspot(selectedHotspot.id)

    const res = await fetch('/api/hotspots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaId: media.id,
        x: selectedHotspot.x,
        y: selectedHotspot.y,
        audioPath: selectedHotspot.audioPath,
        comment: newComment
      })
    })

    const newHotspot = await res.json()
    setHotspots([...hotspots.filter(h => h.id !== selectedHotspot.id), newHotspot])
    setSelectedHotspot(newHotspot)
    setNewComment('')
  }

  if (!media) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Edit Hotspots: {media.title || 'Untitled'}</h1>
          <a
            href="/admin/upload"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-4">Click on the image to add a hotspot</p>
              <div
                ref={imageRef}
                className="relative cursor-crosshair"
                onClick={handleImageClick}
              >
                <Image
                  src={media.path}
                  alt={media.title || ''}
                  width={1200}
                  height={800}
                  className="w-full rounded-lg"
                />
                {hotspots.map(hotspot => (
                  <button
                    key={hotspot.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedHotspot(hotspot)
                      setNewComment(hotspot.comment || '')
                    }}
                    className={`absolute w-8 h-8 rounded-full border-4 shadow-lg transition ${
                      selectedHotspot?.id === hotspot.id
                        ? 'bg-blue-500 border-white scale-125'
                        : 'bg-red-500 border-white hover:scale-110'
                    }`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg h-fit">
            <h2 className="text-xl font-bold mb-4">Hotspot Editor</h2>
            {selectedHotspot ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Audio File</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    disabled={uploading}
                    className="w-full"
                  />
                  {selectedHotspot.audioPath && (
                    <audio src={selectedHotspot.audioPath} controls className="w-full mt-2" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    rows={3}
                  />
                  <button
                    onClick={handleSaveComment}
                    className="w-full mt-2 bg-green-500 text-white py-2 rounded hover:bg-green-600"
                  >
                    Save Comment
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteHotspot(selectedHotspot.id)}
                  className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
                >
                  Delete Hotspot
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Click on a hotspot to edit it, or click on the image to create a new one.</p>
            )}

            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium mb-2">All Hotspots ({hotspots.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {hotspots.map((h, i) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      setSelectedHotspot(h)
                      setNewComment(h.comment || '')
                    }}
                    className={`p-2 rounded cursor-pointer ${
                      selectedHotspot?.id === h.id ? 'bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <span className="font-medium">Hotspot {i + 1}</span>
                    {h.audioPath && <span className="ml-2 text-green-600">audio</span>}
                    {h.comment && <span className="ml-2 text-blue-600">comment</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
