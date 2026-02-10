import { KanbanSidebar } from "@/components/kanban/sidebar"
import { BoardHeader } from "@/components/kanban/board-header"
import { KanbanBoard } from "@/components/kanban/kanban-board"

function App() {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            <KanbanSidebar />
            <main className="flex flex-col flex-1 overflow-hidden">
                <BoardHeader />
                <KanbanBoard />
            </main>
        </div>
    )
}

export default App
