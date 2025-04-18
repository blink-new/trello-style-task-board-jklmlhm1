
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './ui/card';
import { Task, Tag } from '../lib/supabase';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const handleSave = () => {
    // In a real app, we would save the changes to the database here
    setIsEditing(false);
  };

  return (
    <>
      <Card 
        ref={setNodeRef} 
        style={style} 
        className="p-3 mb-2 bg-white cursor-grab hover:shadow-md transition-shadow animate-fade-in"
        onClick={() => setIsDialogOpen(true)}
        {...attributes}
        {...listeners}
      >
        <h4 className="font-medium mb-2">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.map((tag) => (
              <Badge 
                key={tag.id} 
                style={{ backgroundColor: tag.color, color: getContrastColor(tag.color) }}
                className="text-xs"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-xl"
                autoFocus
              />
            ) : (
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
            )}
          </DialogHeader>
          
          <div className="space-y-4">
            {isEditing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                className="min-h-[100px]"
              />
            ) : (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-gray-700">
                  {task.description || "No description provided."}
                </p>
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      style={{ backgroundColor: tag.color, color: getContrastColor(tag.color) }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to determine text color based on background color
function getContrastColor(hexColor: string): string {
  // Remove the # if it exists
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
}