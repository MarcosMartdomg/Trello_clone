import { KanbanSidebar } from "@/components/kanban/sidebar"
import { BoardHeader } from "@/components/kanban/board-header"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthScreen } from "@/components/auth/auth-screen"
import { Loader2 } from "lucide-react"

function App() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return <AuthScreen />
    }

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
