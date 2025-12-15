export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-8">DE GELSIN</h1>
        <p className="text-xl mb-8">Interactive Photo Gallery</p>
        <div className="space-x-4">
          <a href="/gallery" className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 inline-block">
            View Gallery
          </a>
          <a href="/admin" className="px-8 py-3 bg-transparent border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-purple-600 inline-block">
            Admin Login
          </a>
        </div>
      </div>
    </div>
  )
}
