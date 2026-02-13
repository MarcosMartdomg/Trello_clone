import { KanbanSidebar } from "@/components/kanban/sidebar"
import { BoardHeader } from "@/components/kanban/board-header"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import { MyTasksView } from "@/components/kanban/my-tasks-view"
import { BoardsListView } from "@/components/kanban/boards-list-view"
import { CalendarView } from "@/components/kanban/calendar-view"
import { InboxView } from "@/components/kanban/inbox-view"
import { NotificationToaster } from "@/components/kanban/notification-toaster"
import { GlobalSearch } from "@/components/kanban/global-search"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthScreen } from "@/components/auth/auth-screen"
import { useKanbanStore } from "@/lib/store"
import { Loader2 } from "lucide-react"

function App() {
    const { user, loading } = useAuth()
    const { currentView } = useKanbanStore()

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
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300 ease-in-out">
            <KanbanSidebar />
            <main className="flex flex-col flex-1 overflow-hidden transition-colors duration-300 ease-in-out">
                <BoardHeader />
                {currentView === 'board' ? <KanbanBoard /> :
                    currentView === 'boards-list' ? <BoardsListView /> :
                        currentView === 'calendar' ? <CalendarView /> :
                            currentView === 'inbox' ? <InboxView /> :
                                <MyTasksView />}
            </main>
            <GlobalSearch />
            <NotificationToaster />
        </div>
    )
}

export default App
