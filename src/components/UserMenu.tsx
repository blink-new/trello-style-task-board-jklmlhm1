
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

interface UserMenuProps {
  email: string;
  onSignOut: () => void;
}

export function UserMenu({ email, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      onSignOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign out');
    }
  };
  
  // Get initials from email
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary-100">
            <AvatarFallback className="bg-primary-100 text-primary-700">
              {getInitials(email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="truncate">{email}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600 cursor-pointer flex items-center gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}