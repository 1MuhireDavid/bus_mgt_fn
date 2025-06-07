'use client';

import { Inter } from 'next/font/google'
import './globals.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { authAPI } from '@/lib/api'
import { ToastContainer } from 'react-toastify';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())
  const { setUser, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const response = await authAPI.getProfile()
          setUser(response.data.data)
        } catch (error) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [setUser])

  if (isLoading) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          {isAuthenticated ? (
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 overflow-auto bg-background">
                {children}
              </main>
            </div>
          ) : (
            children
          )}
          <ToastContainer/>
        </QueryClientProvider>
      </body>
    </html>
  )
}