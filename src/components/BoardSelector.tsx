
import { useState, useEffect } from 'react';
import { supabase, Board } from '../lib/supabase';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import { CreateBoardDialog } from './CreateBoardDialog';
import { toast } from 'sonner';

interface BoardSelectorProps {
  selectedBoard: Board | null;
  onBoardSelect: (board: Board) => void;
}

export function BoardSelector({ selectedBoard, onBoardSelect }: BoardSelectorProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBoards = async () => {
    setIsLoading(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      setBoards(data);
      
      // If we have boards but no selected board, select the first one
      if (data.length > 0 && !selectedBoard) {
        onBoardSelect(data[0]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedBoard?.id}
        onValueChange={(value) => {
          const board = boards.find(b => b.id === value);
          if (board) onBoardSelect(board);
        }}
        disabled={isLoading || boards.length === 0}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={isLoading ? "Loading boards..." : "Select a board"} />
        </SelectTrigger>
        <SelectContent>
          {boards.map((board) => (
            <SelectItem key={board.id} value={board.id}>
              {board.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsCreateDialogOpen(true)}
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
      
      <CreateBoardDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onBoardCreated={fetchBoards}
      />
    </div>
  );
}