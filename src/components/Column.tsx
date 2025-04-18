
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MoreHorizontal, PlusCircle, X } from 'lucide-react';
import { Column as ColumnType, Task } from '../lib/supabase';
import { TaskCard } from './TaskCard';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onColumnUpdate: (id: string, title: string) => void;
  onColumnDelete: (id: string) => void;
  onAddTask: (columnId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

export function Column({ 
  column, 
  tasks, 
  onColumnUpdate, 
  onColumnDelete, 
  onAddTask,
  onUpdateTask,
  onDeleteTask
}: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const handleSubmit = () => {
    if (title.trim()) {
      onColumnUpdate(column.id, title);
      setIsEditing(false);
    }
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(column.id);
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className="flex flex-col w-80 min-h-[500px] max-h-[80vh] bg-gray-50 rounded-md shadow-sm"
    >
      <div 
        className="p-3 flex items-center justify-between bg-white rounded-t-md border-b cursor-grab"
        {...attributes}
        {...listeners}
      >
        {isEditing ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex items-center gap-2 w-full"
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="font-medium"
            />
            <Button type="submit" size="sm" variant="ghost">
              Save
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setTitle(column.title);
                setIsEditing(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <>
            <h3 
              className="font-medium text-gray-800 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {column.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onColumnDelete(column.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <div className="flex-1 p-2 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>

      <div className="p-3 border-t bg-white rounded-b-md">
        {isAddingTask ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAddTask();
            }}
            className="flex flex-col gap-2"
          >
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Add
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setNewTaskTitle('');
                  setIsAddingTask(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-center gap-1 text-gray-600 hover:text-primary hover:bg-gray-100"
            onClick={() => setIsAddingTask(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        )}
      </div>
    </Card>
  );
}