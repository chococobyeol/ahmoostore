'use client'

import dynamic from 'next/dynamic'
import Header from './Header'

const UserMenuSidebar = dynamic(() => import('./UserMenuSidebar'), {
  ssr: false
})

const CartSidebar = dynamic(() => import('./CartSidebar'), {
  ssr: false
})

export default function ClientLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <UserMenuSidebar />
      <CartSidebar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
} 