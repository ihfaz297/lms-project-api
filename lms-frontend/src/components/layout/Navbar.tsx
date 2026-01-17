import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, LogOut, User, BookOpen, LayoutDashboard, Wallet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">LearnHub</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
            Courses
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="hidden md:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/courses" className="flex items-center gap-2 cursor-pointer">
                    <BookOpen className="h-4 w-4" />
                    My Courses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/bank" className="flex items-center gap-2 cursor-pointer">
                    <Wallet className="h-4 w-4" />
                    Bank Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
