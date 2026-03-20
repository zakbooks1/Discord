import './globals.css'

export const metadata = {
  title: 'zakcord',
  description: 'Created by Zak',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#313338' }}>
        {children}
      </body>
    </html>
  )
}
