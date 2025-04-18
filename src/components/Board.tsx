
import { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  horizontalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { BoardHeader } from './BoardHeader';
import { supabase, Board as BoardType, Column as ColumnType, Task } from '../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Board() {
  const [board, setBoard] = useState<BoardType | null>(null);
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchBoardData();
  }, []);

  const fetchBoardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch the first board (for simplicity)
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .limit(1)
        .single();
      
      if (boardError) throw boardError;
      setBoard(boardData);
      
      // Fetch columns for this board
      const { data: columnsData, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardData.id)
        .order('position');
      
      if (columnsError) throw columnsError;
      setColumns(columnsData);
      
      // Fetch tasks for all columns
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          tags:task_tags(
            tag:tags(*)
          )
        `)
        .in('column_id', columnsData.map(col => col.id))
        .order('position');
      
      if (tasksError) throw tasksError;
      
      // Transform the nested tags data structure
      const transformedTasks = tasksData.map((task: any) => {
        const tags = task.tags
          ? task.tags.map((tt: any) => tt.tag)
          : [];
        
        return {
          ...task,
          tags
        };
      });
      
      setTasks(transformedTasks);
    } catch (err: any) {
      console.error('Error fetching board data:', err);
      setError(err.message || 'Failed to load board data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const { data } = active;
    setActiveItem(data.current);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // If we're dragging a task over a column
    if (activeData?.type === 'task' && overData?.type === 'column') {
      setTasks(tasks => {
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return tasks;
        
        return tasks.map(task => 
          task.id === activeId 
            ? { ...task, column_id: overId as string } 
            : task
        );
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }
    
    const activeData = active.data.current;
    
    if (activeData?.type === 'column') {
      // Reordering columns
      const oldIndex = columns.findIndex(col => col.id === activeId);
      const newIndex = columns.findIndex(col => col.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        
        // Update positions
        const updatedColumns = newColumns.map((col, index) => ({
          ...col,
          position: index
        }));
        
        setColumns(updatedColumns);
        
        // Update in database
        try {
          for (const col of updatedColumns) {
            await supabase
              .from('columns')
              .update({ position: col.position })
              .eq('id', col.id);
          }
        } catch (err) {
          console.error('Error updating column positions:', err);
          // Revert on error
          fetchBoardData();
        }
      }
    } else if (activeData?.type === 'task') {
      // Find the task
      const task = tasks.find(t => t.id === activeId);
      if (!task) {
        setActiveId(null);
        setActiveItem(null);
        return;
      }
      
      // Get tasks in the same column
      const columnTasks = tasks
        .filter(t => t.column_id === task.column_id)
        .sort((a, b) => a.position - b.position);
      
      const oldIndex = columnTasks.findIndex(t => t.id === activeId);
      const newIndex = columnTasks.findIndex(t => t.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Reordering within the same column
        const newColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);
        
        // Update positions
        const updatedTasks = newColumnTasks.map((t, index) => ({
          ...t,
          position: index
        }));
        
        // Update the tasks state
        setTasks(tasks.map(t => 
          updatedTasks.find(ut => ut.id === t.id) || t
        ));
        
        // Update in database
        try {
          for (const t of updatedTasks) {
            await supabase
              .from('tasks')
              .update({ position: t.position })
              .eq('id', t.id);
          }
        } catch (err) {
          console.error('Error updating task positions:', err);
          // Revert on error
          fetchBoardData();
        }
      } else {
        // Moving to a different column
        try {
          // Update the task's column_id in the database
          await supabase
            .from('tasks')
            .update({ column_id: task.column_id })
            .eq('id', task.id);
          
          // Refetch to get the correct order
          fetchBoardData();
        } catch (err) {
          console.error('Error moving task to different column:', err);
          // Revert on error
          fetchBoardData();
        }
      }
    }
    
    setActiveId(null);
    setActiveItem(null);
  };

  const handleUpdateBoard = async (title: string) => {
    if (!board) return;
    
    try {
      await supabase
        .from('boards')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', board.id);
      
      setBoard({ ...board, title });
    } catch (err) {
      console.error('Error updating board:', err);
    }
  };

  const handleAddColumn = async () => {
    if (!board || !newColumnTitle.trim()) return;
    
    try {
      const position = columns.length;
      
      const { data, error } = await supabase
        .from('columns')
        .insert({
          board_id: board.id,
          title: newColumnTitle,
          position
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setColumns([...columns, data]);
      setNewColumnTitle('');
      setIsAddColumnDialogOpen(false);
    } catch (err) {
      console.error('Error adding column:', err);
    }
  };

  const handleUpdateColumn = async (id: string, title: string) => {
    try {
      await supabase
        .from('columns')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      setColumns(columns.map(col => 
        col.id === id ? { ...col, title } : col
      ));
    } catch (err) {
      console.error('Error updating column:', err);
    }
  };

  const handleDeleteColumn = async (id: string) => {
    try {
      await supabase
        .from('columns')
        .delete()
        .eq('id', id);
      
      setColumns(columns.filter(col => col.id !== id));
      setTasks(tasks.filter(task => task.column_id !== id));
    } catch (err) {
      console.error('Error deleting column:', err);
    }
  };

  const handleAddTask = async (columnId: string) => {
    try {
      // Get the highest position in this column
      const columnTasks = tasks.filter(t => t.column_id === columnId);
      const position = columnTasks.length;
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          column_id: columnId,
          title: 'New Task',
          position
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setTasks([...tasks, { ...data, tags: [] }]);
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Board</h2>
        <p className="text-gray-700">{error}</p>
        <Button 
          onClick={fetchBoardData} 
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-bold mb-4">No Board Found</h2>
        <p className="text-gray-700">Create a new board to get started.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <BoardHeader 
        board={board} 
        onBoardUpdate={handleUpdateBoard}
        onAddColumn={() => setIsAddColumnDialogOpen(true)}
      />
      
      <div className="mt-6 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-h-[500px]">
            <SortableContext
              items={columns.map(col => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map(column => (
                <Column
                  key={column.id}
                  column={column}
                  tasks={tasks.filter(task => task.column_id === column.id)}
                  onColumnUpdate={handleUpdateColumn}
                  onColumnDelete={handleDeleteColumn}
                  onAddTask={handleAddTask}
                />
              ))}
            </SortableContext>
          </div>
          
          <DragOverlay>
            {activeId && activeItem?.type === 'column' && (
              <Column
                column={columns.find(col => col.id === activeId)!}
                tasks={tasks.filter(task => task.column_id === activeId)}
                onColumnUpdate={handleUpdateColumn}
                onColumnDelete={handleDeleteColumn}
                onAddTask={handleAddTask}
              />
            )}
            {activeId && activeItem?.type === 'task' && (
              <TaskCard task={tasks.find(task => task.id === activeId)!} />
            )}
          </DragOverlay>
        </DndContext>
      </div>
      
      <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Enter column title..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddColumn}>Add Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}