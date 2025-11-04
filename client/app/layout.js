import './globals.css'

export const metadata = {
  title: 'Collaborative Playlist Manager',
  description: 'Realtime collaborative playlist with drag-and-drop and voting',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}

