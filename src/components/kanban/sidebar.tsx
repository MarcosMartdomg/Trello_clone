
"use client"

import { useState, useEffect } from "react"
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
    User,
    Layout,
    Trash2,
    LogOut,
    Calendar as CalendarIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useKanbanStore } from "@/lib/store"
import { useAuth } from "@/components/auth/auth-provider"
import { CreateBoardModal } from "./create-board-modal"
import { ConfirmDeleteModal } from "./confirm-delete-modal"
import { UserProfileModal } from "@/components/auth/user-profile-modal"
import { useTranslation } from "@/hooks/use-translation"

export function KanbanSidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const [boardToDelete, setBoardToDelete] = useState<{ id: string, name: string } | null>(null)

    const {
        boards,
        activeBoardId,
        setActiveBoard,
        createBoard,
        deleteBoard,
        fetchBoards,
        currentView,
        setCurrentView
    } = useKanbanStore()
    const { user, signOut } = useAuth()
    const { t } = useTranslation()
    const userInitial = user?.email?.[0].toUpperCase() || "U"

    useEffect(() => {
        if (user) {
            fetchBoards(user.id)
        }
    }, [user, fetchBoards])

    const navItems = [
        { id: "search", label: t('sidebar.search'), icon: Search },
        { id: "board", label: t('sidebar.myBoards'), icon: LayoutDashboard },
        { id: "tasks", label: t('sidebar.myTasks'), icon: CheckSquare },
        { id: "calendar", label: t('calendar.title'), icon: CalendarIcon },
        { id: "inbox", label: t('sidebar.inbox'), icon: Inbox, badge: 3 },
        { id: "team", label: t('sidebar.team'), icon: Users },
    ]

    const handleCreateBoard = (name: string, type: 'personal' | 'shared' = 'personal') => {
        if (user) {
            createBoard(name, user.id, type)
        }
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
                        onClick={() => {
                            if (item.id === "tasks") {
                                setCurrentView("my-tasks")
                            } else if (item.id === "board") {
                                setCurrentView("boards-list")
                            } else if (item.id === "calendar") {
                                setCurrentView("calendar")
                            }
                        }}
                        className={cn(
                            "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                            (item.id === "tasks" && currentView === "my-tasks") ||
                                (item.id === "board" && currentView === "boards-list") ||
                                (item.id === "calendar" && currentView === "calendar")
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
                    <div className="pt-6 space-y-6">
                        {/* Personal Boards Section */}
                        <div>
                            <div className="flex items-center justify-between px-3 mb-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    {t('sidebar.personalBoards')}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="p-1 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-all duration-200"
                                    title={t('sidebar.createBoard')}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="space-y-0.5">
                                {boards
                                    .filter(b => (b.type || 'personal') === 'personal')
                                    .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
                                    .map((board) => (
                                        <BoardItem
                                            key={board.id}
                                            board={board}
                                            activeBoardId={activeBoardId}
                                            setActiveBoard={setActiveBoard}
                                            setCurrentView={setCurrentView}
                                            onDelete={() => setBoardToDelete({ id: board.id, name: board.name })}
                                        />
                                    ))}
                                {boards.filter(b => (b.type || 'personal') === 'personal').length === 0 && (
                                    <p className="px-3 py-2 text-xs text-muted-foreground italic">{t('sidebar.noBoards')}</p>
                                )}
                            </div>
                        </div>

                        {/* Shared Boards Section */}
                        <div className="pb-4">
                            <div className="flex items-center justify-between px-3 mb-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                                    <Users className="w-3 h-3" />
                                    {t('sidebar.sharedBoards')}
                                </span>
                            </div>

                            <div className="space-y-0.5">
                                {boards
                                    .filter(b => b.type === 'shared')
                                    .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
                                    .map((board) => (
                                        <BoardItem
                                            key={board.id}
                                            board={board}
                                            activeBoardId={activeBoardId}
                                            setActiveBoard={setActiveBoard}
                                            setCurrentView={setCurrentView}
                                            onDelete={() => setBoardToDelete({ id: board.id, name: board.name })}
                                            isShared
                                        />
                                    ))}
                                {boards.filter(b => b.type === 'shared').length === 0 && (
                                    <p className="px-3 py-2 text-xs text-muted-foreground italic">{t('members.noMembers')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Bottom section: User Profile & Settings */}
            <div className="border-t border-sidebar-border p-3 space-y-2">
                {!collapsed && user && (
                    <button
                        type="button"
                        onClick={() => setIsProfileModalOpen(true)}
                        className="flex items-center gap-3 w-full px-2 py-2 mb-2 bg-sidebar-accent/30 rounded-xl border border-white/5 hover:bg-sidebar-accent/50 hover:border-white/10 transition-all duration-200 group text-left"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-[10px] font-black text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                            {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-foreground uppercase tracking-wider truncate">{t('sidebar.user')}</p>
                            <p className="text-[10px] text-muted-foreground truncate group-hover:text-primary transition-colors">{user.email}</p>
                        </div>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => signOut()}
                    className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-all duration-150"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="font-medium">{t('sidebar.logout')}</span>}
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
                title={t('board.deleteTitle')}
                description={t('board.deleteConfirm', { name: boardToDelete?.name || '' }) + ' ' + t('board.deleteWarning')}
            />

            <UserProfileModal
                open={isProfileModalOpen}
                onOpenChange={setIsProfileModalOpen}
            />
        </aside>
    )
}

function BoardItem({ board, activeBoardId, setActiveBoard, setCurrentView, onDelete, isShared }: {
    board: any,
    activeBoardId: string | null,
    setActiveBoard: (id: string) => void,
    setCurrentView: (view: 'board' | 'my-tasks') => void,
    onDelete: () => void,
    isShared?: boolean
}) {
    const { toggleBoardFavorite } = useKanbanStore();

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleBoardFavorite(board.id, !board.isFavorite);
    };

    return (
        <div className="group flex items-center gap-1 pr-2">
            <button
                type="button"
                onClick={() => {
                    setActiveBoard(board.id);
                    setCurrentView("board");
                }}
                className={cn(
                    "flex-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                    activeBoardId === board.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/30 hover:text-foreground"
                )}
            >
                {isShared ? (
                    <Users className="w-3.5 h-3.5 shrink-0 opacity-70" />
                ) : (
                    <Layout className="w-3.5 h-3.5 shrink-0 opacity-70" />
                )}
                <span className="flex-1 text-left truncate">{board.name}</span>
            </button>
            <button
                onClick={handleToggleFavorite}
                className={cn(
                    "opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all duration-200",
                    board.isFavorite
                        ? "opacity-100 text-amber-400 hover:text-amber-500"
                        : "text-muted-foreground hover:text-amber-400"
                )}
                title={board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
                <Star className={cn("w-3 h-3", board.isFavorite && "fill-amber-400")} />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    );
}
