
"use client"

import { useState, useEffect, useRef } from "react"
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
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { CreateBoardModal } from "./create-board-modal"
import { ConfirmDeleteModal } from "./confirm-delete-modal"
import { ConfirmLeaveModal } from "./confirm-leave-modal"
import { UserProfileModal } from "@/components/auth/user-profile-modal"
import { useTranslation } from "@/hooks/use-translation"
import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function KanbanSidebar() {
    const navigate = useNavigate()
    const [collapsed, setCollapsed] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const [boardToDelete, setBoardToDelete] = useState<{ id: string, name: string } | null>(null)
    const [boardToLeave, setBoardToLeave] = useState<{ id: string, name: string } | null>(null)

    const {
        boards,
        activeBoardId,
        setActiveBoard,
        createBoard,
        deleteBoard,
        leaveBoard,
        fetchBoards,
        fetchInvitations,
        invitations,
        currentView,
        setCurrentView,
        setSearchOpen,
        addNotification
    } = useKanbanStore()
    const prevInvitationIdsRef = useRef<string[]>([])
    const { user, signOut } = useAuth()
    const { t } = useTranslation()
    const userInitial = user?.email?.[0].toUpperCase() || "U"

    useEffect(() => {
        if (user) {
            fetchBoards(user.id)
            fetchInvitations(user.id)

            // Real-time subscription for new invitations
            const channel = supabase
                .channel('invitation-notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'board_members',
                        filter: `user_id=eq.${user.id}`
                    },
                    async (payload) => {
                        const newRecord = payload.new as any;
                        if (newRecord.status === 'pending') {
                            // Fetch updated invitations to get board name
                            await fetchInvitations(user.id);
                            const updatedInvitations = useKanbanStore.getState().invitations;
                            const newInvite = updatedInvitations.find((inv: any) => inv.board_id === newRecord.board_id);

                            addNotification({
                                id: `inv-${newRecord.board_id}-${Date.now()}`,
                                title: 'Nueva invitación',
                                boardId: newRecord.board_id,
                                boardName: newInvite?.boards?.name || 'Tablero',
                                type: 'invitation',
                                userId: user.id
                            });
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'board_members',
                        filter: `user_id=eq.${user.id}`
                    },
                    async (payload) => {
                        const updatedRecord = payload.new as any;
                        if (updatedRecord.status === 'pending') {
                            // Reinvited - fetch and notify
                            await fetchInvitations(user.id);
                            const updatedInvitations = useKanbanStore.getState().invitations;
                            const newInvite = updatedInvitations.find((inv: any) => inv.board_id === updatedRecord.board_id);

                            addNotification({
                                id: `inv-${updatedRecord.board_id}-${Date.now()}`,
                                title: 'Nueva invitación',
                                boardId: updatedRecord.board_id,
                                boardName: newInvite?.boards?.name || 'Tablero',
                                type: 'invitation',
                                userId: user.id
                            });
                        } else if (updatedRecord.status === 'accepted') {
                            // Refresh boards when accepted
                            await fetchBoards(user.id);
                        }
                    }
                )
                .subscribe();

            // Poll for new invitations every 10 seconds as fallback
            const interval = setInterval(() => {
                fetchInvitations(user.id)
            }, 10000)

            return () => {
                clearInterval(interval)
                supabase.removeChannel(channel)
            }
        }
    }, [user, fetchBoards, fetchInvitations, addNotification])

    const navItems = [
        { id: "board", label: t('sidebar.myBoards'), icon: LayoutDashboard },
        { id: "tasks", label: t('sidebar.myTasks'), icon: CheckSquare },
        { id: "calendar", label: t('calendar.title'), icon: CalendarIcon },
        { id: "inbox", label: t('sidebar.inbox'), icon: Inbox, badge: invitations.length > 0 ? invitations.length : undefined }
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

    const handleLeaveBoard = async (newOwnerId?: string) => {
        if (boardToLeave) {
            try {
                // We await the core logic, but we want the store to handle the state update optimistically if possible
                await leaveBoard(boardToLeave.id, newOwnerId)
                setBoardToLeave(null)
            } catch (error) {
                // Error is handled by the modal and store notifications
                throw error
            }
        }
    }

    return (
        <aside
            className={cn(
                "relative flex flex-col border-r border-sidebar-border bg-sidebar h-screen transition-all duration-300 ease-in-out shrink-0 z-20 transition-colors",
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
                            if (item.id === "search") {
                                setSearchOpen(true)
                            } else if (item.id === "tasks") {
                                setCurrentView("my-tasks")
                            } else if (item.id === "board") {
                                setCurrentView("boards-list")
                            } else if (item.id === "calendar") {
                                setCurrentView("calendar")
                            } else if (item.id === "inbox") {
                                setCurrentView("inbox")
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
                                    .filter(b => b.ownerId === user?.id && b.type !== 'shared')
                                    .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
                                    .map((board) => (
                                        <BoardItem
                                            key={board.id}
                                            board={board}
                                            activeBoardId={activeBoardId}
                                            setActiveBoard={setActiveBoard}
                                            setCurrentView={setCurrentView}
                                            onDelete={() => setBoardToDelete({ id: board.id, name: board.name })}
                                            onLeave={() => { }} // Not used for personal
                                            isOwner={true}
                                        />
                                    ))}
                                {boards.filter(b => b.ownerId === user?.id && b.type !== 'shared').length === 0 && (
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
                                    .filter(b => b.ownerId !== user?.id || b.type === 'shared')
                                    .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
                                    .map((board) => (
                                        <BoardItem
                                            key={board.id}
                                            board={board}
                                            activeBoardId={activeBoardId}
                                            setActiveBoard={setActiveBoard}
                                            setCurrentView={setCurrentView}
                                            onDelete={() => setBoardToDelete({ id: board.id, name: board.name })}
                                            onLeave={() => setBoardToLeave({ id: board.id, name: board.name })}
                                            isShared
                                            isOwner={board.ownerId === user?.id}
                                        />
                                    ))}
                                {boards.filter(b => b.ownerId !== user?.id || b.type === 'shared').length === 0 && (
                                    <div className="px-3 py-2 space-y-2">
                                        <p className="text-xs text-muted-foreground italic">{t('members.noMembers')}</p>
                                        {invitations.length > 0 && (
                                            <button
                                                onClick={() => setCurrentView('inbox')}
                                                className="flex items-center gap-2 w-full p-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 text-[10px] font-bold text-primary transition-all animate-pulse"
                                            >
                                                <Inbox className="w-3 h-3" />
                                                <span>{t('sidebar.checkInbox') || "Tienes invitaciones pendientes"}</span>
                                            </button>
                                        )}
                                    </div>
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
                        <Avatar className="w-9 h-9 rounded-lg border-2 border-background shadow-lg transition-transform group-hover:scale-105">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-slate-900 text-[10px] font-black text-white rounded-lg">
                                {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-foreground uppercase tracking-wider truncate">
                                {user.user_metadata?.full_name || t('sidebar.user')}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate group-hover:text-primary transition-colors">{user.email}</p>
                        </div>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => {
                        signOut()
                        navigate("/")
                    }}
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

            <ConfirmLeaveModal
                isOpen={!!boardToLeave}
                onClose={() => setBoardToLeave(null)}
                onConfirm={handleLeaveBoard}
                title={t('board.leaveTitle')}
                description={t('board.leaveConfirm', { name: boardToLeave?.name || '' }) + ' ' + t('board.leaveWarning')}
                boardId={boardToLeave?.id || ''}
            />

            <UserProfileModal
                open={isProfileModalOpen}
                onOpenChange={setIsProfileModalOpen}
            />
        </aside>
    )
}

function BoardItem({ board, activeBoardId, setActiveBoard, setCurrentView, onDelete, onLeave, isShared, isOwner }: {
    board: any,
    activeBoardId: string | null,
    setActiveBoard: (id: string) => void,
    setCurrentView: (view: 'board' | 'my-tasks') => void,
    onDelete: () => void,
    onLeave: () => void,
    isShared?: boolean,
    isOwner?: boolean
}) {
    const { t } = useTranslation();
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
            {/* If Shared Board and Owner: Show both Delete and Leave (Transfer) */}
            {isShared && isOwner && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onLeave();
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-orange-500/10 text-muted-foreground hover:text-orange-500 transition-all duration-200"
                        title={t('board.leaveTitle')}
                    >
                        <LogOut className="w-3 h-3" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                        title={t('common.delete')}
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </>
            )}

            {/* If Shared Board and NOT Owner: Show Leave only */}
            {isShared && !isOwner && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onLeave();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                    title={t('board.leaveTitle')}
                >
                    <LogOut className="w-3 h-3" />
                </button>
            )}

            {/* If Personal Board (Always Owner): Show Delete only */}
            {!isShared && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                    title={t('common.delete')}
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}
