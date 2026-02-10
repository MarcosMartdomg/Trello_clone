
"use client"

import { useState } from "react"
import {
    Search,
    LayoutDashboard,
    CheckSquare,
    Settings,
    ChevronLeft,
    ChevronRight,
    Plus,
    Star,
    Inbox,
    Users,
    Layout,
    Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useKanbanStore } from "@/lib/store"
import { CreateBoardModal } from "./create-board-modal"
import { ConfirmDeleteModal } from "./confirm-delete-modal"

export function KanbanSidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const [activeNav, setActiveNav] = useState("board")
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [boardToDelete, setBoardToDelete] = useState<{ id: string, name: string } | null>(null)

    const { boards, activeBoardId, setActiveBoard, createBoard, deleteBoard } = useKanbanStore()

    const navItems = [
        { id: "search", label: "Search", icon: Search },
        { id: "board", label: "My Boards", icon: LayoutDashboard },
        { id: "tasks", label: "My Tasks", icon: CheckSquare },
        { id: "inbox", label: "Inbox", icon: Inbox, badge: 3 },
        { id: "team", label: "Team", icon: Users },
    ]

    const handleCreateBoard = (name: string) => {
        createBoard(name)
    }

    const handleDeleteBoard = () => {
        if (boardToDelete) {
            deleteBoard(boardToDelete.id)
            setBoardToDelete(null)
        }
    }

    return (
        <aside
            className={cn(
                "relative flex flex-col border-r border-sidebar-border bg-sidebar h-screen transition-all duration-300 ease-in-out shrink-0 z-20",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo area */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                    <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
                </div>
                {!collapsed && (
                    <span className="text-sm font-semibold text-foreground tracking-tight">
                        FlowBoard
                    </span>
                )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveNav(item.id)}
                        className={cn(
                            "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                            activeNav === item.id
                                ? "bg-primary/10 text-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                        )}
                    >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && (
                            <>
                                <span className="flex-1 text-left truncate font-medium">{item.label}</span>
                                {item.badge && (
                                    <span className="flex items-center justify-center h-4.5 min-w-4.5 px-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                                        {item.badge}
                                    </span>
                                )}
                            </>
                        )}
                    </button>
                ))}

                {/* Dynamic Boards List */}
                {!collapsed && (
                    <div className="pt-6">
                        <div className="flex items-center justify-between px-3 mb-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                                Your Boards
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="p-1 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-all duration-200"
                                title="Create board"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="space-y-0.5">
                            {boards.map((board) => (
                                <div key={board.id} className="group flex items-center gap-1 pr-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveBoard(board.id)}
                                        className={cn(
                                            "flex-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                                            activeBoardId === board.id
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                                : "text-sidebar-foreground hover:bg-sidebar-accent/30 hover:text-foreground"
                                        )}
                                    >
                                        <Layout className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                        <span className="flex-1 text-left truncate">{board.name}</span>
                                        {activeBoardId === board.id && (
                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setBoardToDelete({ id: board.id, name: board.name })
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            {boards.length === 0 && (
                                <p className="px-3 py-2 text-xs text-muted-foreground italic">No boards yet</p>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Bottom section */}
            <div className="border-t border-sidebar-border p-2">
                <button
                    type="button"
                    className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors duration-150"
                >
                    <Settings className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Settings</span>}
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-[18px] flex items-center justify-center w-6 h-6 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-sm"
            >
                {collapsed ? (
                    <ChevronRight className="w-3 h-3" />
                ) : (
                    <ChevronLeft className="w-3 h-3" />
                )}
            </button>

            <CreateBoardModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateBoard}
            />

            <ConfirmDeleteModal
                isOpen={!!boardToDelete}
                onClose={() => setBoardToDelete(null)}
                onConfirm={handleDeleteBoard}
                title="Delete Board"
                description={`Are you sure you want to delete "${boardToDelete?.name}"? This action cannot be undone.`}
            />
        </aside>
    )
}
