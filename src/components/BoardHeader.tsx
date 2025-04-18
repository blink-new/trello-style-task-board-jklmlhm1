
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PlusCircle } from 'lucide-react';
import { Board } from '../lib/supabase';

interface BoardHeaderProps {
  board: Board;
  onBoardUpdate: (title: string) => void;
  onAddColumn: () => void;
}

export function BoardHeader({ board, onBoardUpdate, onAddColumn }: BoardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(board.title);

  const handleSubmit = () => {
    if (title.trim()) {
      onBoardUpdate(title);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white shadow-sm rounded-t-lg">
      {isEditing ? (
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="font-bold text-xl"
          />
          <Button type="submit" size="sm">Save</Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setTitle(board.title);
              setIsEditing(false);
            }}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <h1 
          className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
          onClick={() => setIsEditing(true)}
        >
          {board.title}
        </h1>
      )}
      <Button onClick={onAddColumn} className="flex items-center gap-1">
        <PlusCircle className="h-4 w-4" />
        <span>Add Column</span>
      </Button>
    </div>
  );
}