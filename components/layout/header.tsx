'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useCart } from '@/lib/cart/cart-context';
import { PhoneAuthDialog } from '@/components/auth/phone-auth-dialog';
import { EmailAuthDialog } from '@/components/auth/email-auth-dialog';
import { CategorySidebar } from '@/components/layout/category-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, Search, LogOut, Settings, ShoppingBag, Package, Phone, Menu, Mail } from 'lucide-react';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneAuthOpen, setPhoneAuthOpen] = useState(false);
  const [emailAuthOpen, setEmailAuthOpen] = useState(false);
  const [categorySidebarOpen, setCategorySidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <div className="bg-blue-900 text-white py-2 text-center text-sm font-medium">
        Spraxe
      </div>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCategorySidebarOpen(!categorySidebarOpen)}
                className="flex-shrink-0"
              >
                <Menu className="h-6 w-6" />
              </Button>

              <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
                <img src="/spraxe.png" alt="Spraxe" className="h-10 w-auto" />
              </Link>
            </div>

            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </form>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="relative gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="hidden sm:inline">Cart</span>
                  {itemCount > 0 && (
                    <Badge variant="destructive" className="ml-1 px-2 py-0.5 text-xs">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  {user ? (
                    <>
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="font-medium">{profile?.full_name}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                        <Package className="mr-2 h-4 w-4" />
                        My Orders
                      </DropdownMenuItem>
                      {profile?.role === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push('/admin')}>
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuLabel className="font-semibold text-base">
                        Account
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="p-2 space-y-2">
                        <Button
                          onClick={() => setPhoneAuthOpen(true)}
                          className="w-full justify-start"
                          variant="default"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Login with Phone
                        </Button>
                        <Button
                          onClick={() => setEmailAuthOpen(true)}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Login with Email
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <CategorySidebar
        isOpen={categorySidebarOpen}
        onClose={() => setCategorySidebarOpen(false)}
      />
      <PhoneAuthDialog open={phoneAuthOpen} onOpenChange={setPhoneAuthOpen} />
      <EmailAuthDialog open={emailAuthOpen} onOpenChange={setEmailAuthOpen} />
    </>
  );
}
