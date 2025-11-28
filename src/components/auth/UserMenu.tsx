'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { AuthDialog } from './AuthDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bookmark, Camera, LogOut, Settings, Shield } from 'lucide-react';
import { isUserAdmin } from '@/lib/adminAuth';

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const adminStatus = await isUserAdmin(user, false);
      setIsAdmin(adminStatus);
    }

    checkAdmin();
  }, [user]);

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse" />;
  }

  if (!user) {
    return (
      <>
        <Button onClick={() => setAuthDialogOpen(true)} variant="outline" size="sm">
          Sign In
        </Button>
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </>
    );
  }

  const initials = user.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:opacity-80 transition">
          <Avatar>
            <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{user.user_metadata?.full_name || 'User'}</span>
            <span className="text-xs text-neutral-500 font-normal">{user.email}</span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="w-4 h-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/bookmarks" className="cursor-pointer">
            <Bookmark className="w-4 h-4 mr-2" />
            My Bookmarks
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile?tab=photos" className="cursor-pointer">
            <Camera className="w-4 h-4 mr-2" />
            My Photos
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/profile?tab=settings" className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer text-primary">
                <Shield className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-error">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
