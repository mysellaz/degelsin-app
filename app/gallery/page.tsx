'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Media {
  id: string
  type: string
  path: string
  title: string | null
  description: string | null
  hotspots: { id: string }[]
}

export default function Gallery() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/media')
      .then(res => res.json())
      .then(data => {
        setMedia(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Gallery</h1>
          <a href="/" className="text-purple-600 hover:underline">Back to Home</a>
        </div>

        {media.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">No photos yet</p>
            <p className="text-gray-400 mt-2">Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {media.map(item => (
              <Link href={`/view/${item.id}`} key={item.id}>
                <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition cursor-pointer">
                  <div className="relative h-64">
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
                    {item.hotspots.length > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                        {item.hotspots.length} hotspots
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg">{item.title || 'Untitled'}</h3>
                    {item.description && (
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
