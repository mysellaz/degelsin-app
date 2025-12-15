'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'

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
  description: string | null
  hotspots: Hotspot[]
}

export default function ViewPhoto() {
  const params = useParams()
  const [media, setMedia] = useState<Media | null>(null)
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/media')
      .then(res => res.json())
      .then(data => {
        const item = data.find((m: Media) => m.id === params.id)
        setMedia(item || null)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!media) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Photo not found</h1>
          <a href="/gallery" className="text-purple-600 hover:underline">Back to Gallery</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">{media.title || 'Untitled'}</h1>
          <a href="/gallery" className="text-purple-600 hover:underline">Back to Gallery</a>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="relative">
            <Image
              src={media.path}
              alt={media.title || ''}
              width={1200}
              height={800}
              className="w-full rounded-lg"
              priority
            />
            {media.hotspots.map(hotspot => (
              <button
                key={hotspot.id}
                onClick={() => setSelectedHotspot(
                  selectedHotspot?.id === hotspot.id ? null : hotspot
                )}
                className={`absolute w-10 h-10 rounded-full border-4 shadow-lg transition-all ${
                  selectedHotspot?.id === hotspot.id
                    ? 'bg-blue-500 border-white scale-125 z-10'
                    : 'bg-red-500 border-white hover:scale-110 animate-pulse'
                }`}
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
          </div>

          {media.description && (
            <p className="mt-4 text-gray-600">{media.description}</p>
          )}
        </div>

        {selectedHotspot && (
          <div className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl text-purple-800">Hotspot Info</h3>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                x
              </button>
            </div>

            {selectedHotspot.comment && (
              <p className="mb-4 text-gray-700 text-lg">{selectedHotspot.comment}</p>
            )}

            {selectedHotspot.audioPath && (
              <div className="mt-4">
                <AudioPlayer
                  src={selectedHotspot.audioPath}
                  autoPlay={false}
                  showJumpControls={false}
                  customAdditionalControls={[]}
                  layout="horizontal"
                />
              </div>
            )}

            {!selectedHotspot.comment && !selectedHotspot.audioPath && (
              <p className="text-gray-500">No content for this hotspot yet.</p>
            )}
          </div>
        )}

        {media.hotspots.length > 0 && !selectedHotspot && (
          <p className="mt-4 text-center text-gray-500">
            Click on a red dot to see more info!
          </p>
        )}
      </div>
    </div>
  )
}
