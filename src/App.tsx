
import { Board } from './components/Board';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-primary-600">Trello-style Task Board</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <Board />
      </main>
      
      <Toaster />
    </div>
  );
}

export default App;