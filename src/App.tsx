
import { useState, useEffect } from 'react';
import { Board } from './components/Board';
import { Toaster } from './components/ui/sonner';
import { AuthForm } from './components/auth/AuthForm';
import { UserMenu } from './components/UserMenu';
import { BoardSelector } from './components/BoardSelector';
import { supabase, Board as BoardType } from './lib/supabase';
import { Button } from './components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CreateBoardDialog } from './components/CreateBoardDialog';

function App() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState<BoardType | null>(null);
  const [isCreateBoardDialogOpen, setIsCreateBoardDialogOpen] = useState(false);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data.session) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || 'User'
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'User'
          });
        } else {
          setUser(null);
          setSelectedBoard(null);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = () => {
    setUser(null);
    setSelectedBoard(null);
  };

  const handleBoardSelect = (board: BoardType) => {
    setSelectedBoard(board);
  };

  const handleBoardUpdate = (board: BoardType) => {
    setSelectedBoard(board);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-600">Task Board</h1>
          
          {user && (
            <div className="flex items-center gap-4">
              <BoardSelector 
                selectedBoard={selectedBoard}
                onBoardSelect={handleBoardSelect}
              />
              
              <Button 
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => setIsCreateBoardDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Board</span>
              </Button>
              
              <UserMenu 
                email={user.email} 
                onSignOut={handleSignOut} 
              />
            </div>
          )}
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {!user ? (
          <div className="max-w-md mx-auto mt-10">
            <AuthForm onAuthSuccess={() => {}} />
          </div>
        ) : selectedBoard ? (
          <Board 
            board={selectedBoard}
            onBoardUpdate={handleBoardUpdate}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to Task Board</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Get started by creating your first board or selecting an existing one from the dropdown above.
            </p>
            <Button 
              onClick={() => setIsCreateBoardDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-5 w-5" />
              Create Your First Board
            </Button>
          </div>
        )}
      </main>
      
      <CreateBoardDialog
        open={isCreateBoardDialogOpen}
        onOpenChange={setIsCreateBoardDialogOpen}
        onBoardCreated={() => {
          // We'll refresh the board selector which will pick up the new board
        }}
      />
      
      <Toaster />
    </div>
  );
}

export default App;