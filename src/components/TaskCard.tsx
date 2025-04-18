
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
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface TaskCardProps {
  task: Task;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function TaskCard({ task, onUpdateTask, onDeleteTask }: TaskCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

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
    if (onUpdateTask) {
      onUpdateTask(task.id, {
        title,
        description
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDeleteTask) {
      onDeleteTask(task.id);
      setIsDialogOpen(false);
    }
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
                <Button variant="outline" onClick={() => {
                  setTitle(task.title);
                  setDescription(task.description || '');
                  setIsEditing(false);
                }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full justify-between">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                {onDeleteTask && (
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => setIsDeleteAlertOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task "{task.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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