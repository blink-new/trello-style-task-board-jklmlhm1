
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoardCreated: () => void;
}

export function CreateBoardDialog({ open, onOpenChange, onBoardCreated }: CreateBoardDialogProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateBoard = async () => {
    if (!title.trim()) return;
    
    setLoading(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { error: boardError } = await supabase
        .from('boards')
        .insert({
          title,
          user_id: userData.user.id
        });
      
      if (boardError) throw boardError;
      
      // Create default columns
      const { data: boardData, error: fetchError } = await supabase
        .from('boards')
        .select('id')
        .eq('title', title)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Add default columns
      const { error: columnsError } = await supabase
        .from('columns')
        .insert([
          { board_id: boardData.id, title: 'To Do', position: 0 },
          { board_id: boardData.id, title: 'In Progress', position: 1 },
          { board_id: boardData.id, title: 'Done', position: 2 }
        ]);
      
      if (columnsError) throw columnsError;
      
      toast.success('Board created successfully!');
      setTitle('');
      onOpenChange(false);
      onBoardCreated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Give your board a name to get started
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Awesome Project"
            className="w-full"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button 
            onClick={handleCreateBoard}
            disabled={!title.trim() || loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Board'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}