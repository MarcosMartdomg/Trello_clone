"use client"

import { useKanbanStore } from "@/lib/store"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { Layout, Users, Star, ArrowRight, Plus } from "lucide-react"
import { useState } from "react"
import { CreateBoardModal } from "./create-board-modal"
import { useAuth } from "@/components/auth/auth-provider"

export function BoardsListView() {
    const { boards, setActiveBoard, setCurrentView, createBoard } = useKanbanStore()
    const { user } = useAuth()
    const { t } = useTranslation()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const personalBoards = boards.filter(b => (b.type || 'personal') === 'personal').sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
    const sharedBoards = boards.filter(b => b.type === 'shared').sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))

    const handleBoardClick = (id: string) => {
        setActiveBoard(id)
        setCurrentView('board')
    }

    const handleCreateBoard = (name: string, type: 'personal' | 'shared' = 'personal') => {
        if (user) {
            createBoard(name, user.id, type)
        }
    }

    return (
        <div className="flex-1 overflow-y-auto bg-background/50 p-8 space-y-12">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight">{t('sidebar.myBoards')}</h1>
                    <p className="text-muted-foreground font-medium">
                        {t('common.manageYourWorkspaces')}
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    {t('sidebar.createBoard')}
                </button>
            </header>

            <div className="space-y-12">
                {/* Personal Boards */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Layout className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">{t('sidebar.personalBoards')}</h2>
                        <span className="text-xs font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            {personalBoards.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {personalBoards.map(board => (
                            <BoardCard key={board.id} board={board} onClick={() => handleBoardClick(board.id)} />
                        ))}
                        {personalBoards.length === 0 && (
                            <div className="col-span-full py-12 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                <Layout className="w-12 h-12 text-muted-foreground/30" />
                                <p className="font-medium text-muted-foreground">{t('sidebar.noBoards')}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Shared Boards */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">{t('sidebar.sharedBoards')}</h2>
                        <span className="text-xs font-black bg-blue-500 text-white px-2 py-0.5 rounded-full">
                            {sharedBoards.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sharedBoards.map(board => (
                            <BoardCard key={board.id} board={board} onClick={() => handleBoardClick(board.id)} isShared />
                        ))}
                        {sharedBoards.length === 0 && (
                            <div className="col-span-full py-12 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                <Users className="w-12 h-12 text-muted-foreground/30" />
                                <p className="font-medium text-muted-foreground">{t('members.noMembers')}</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <CreateBoardModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateBoard}
            />
        </div>
    )
}

function BoardCard({ board, onClick, isShared }: { board: any, onClick: () => void, isShared?: boolean }) {
    const { toggleBoardFavorite } = useKanbanStore();
    const totalCards = board.columns?.reduce((acc: number, col: any) => acc + (col.cards?.length || 0), 0) || 0

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleBoardFavorite(board.id, !board.isFavorite);
    };

    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col text-left p-6 bg-card border border-border/50 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 overflow-hidden"
        >
            {/* Background Accent */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12",
                isShared ? "text-blue-500" : "text-primary"
            )}>
                {isShared ? <Users className="w-full h-full" /> : <Layout className="w-full h-full" />}
            </div>

            <div className="flex items-start justify-between mb-8">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                    isShared ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"
                )}>
                    {isShared ? <Users className="w-6 h-6" /> : <Layout className="w-6 h-6" />}
                </div>
                <button
                    onClick={handleToggleFavorite}
                    className={cn(
                        "p-2 rounded-xl transition-all duration-200 hover:scale-110",
                        board.isFavorite
                            ? "text-amber-400 hover:text-amber-500"
                            : "text-muted-foreground/30 hover:text-amber-400"
                    )}
                    title={board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                >
                    <Star className={cn("w-5 h-5", board.isFavorite && "fill-amber-400")} />
                </button>
            </div>

            <div className="space-y-2 relative z-10">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors truncate pr-8">{board.name}</h3>
                <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Layout className="w-3.5 h-3.5" />
                        {board.columns?.length || 0} {board.columns?.length === 1 ? 'Lista' : 'Listas'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{totalCards} {totalCards === 1 ? 'Tarjeta' : 'Tarjetas'}</span>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between relative z-10">
                <div className="flex -space-x-2">
                    {board.members?.slice(0, 3).map((member: any, i: number) => (
                        <div
                            key={i}
                            className="w-7 h-7 rounded-full border-2 border-card bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary"
                            title={member.name}
                        >
                            {member.name?.[0] || 'U'}
                        </div>
                    ))}
                    {(board.members?.length || 0) > 3 && (
                        <div className="w-7 h-7 rounded-full border-2 border-card bg-secondary flex items-center justify-center text-[8px] font-black text-muted-foreground">
                            +{(board.members?.length || 0) - 3}
                        </div>
                    )}
                </div>
                <div className="p-2 rounded-xl bg-secondary/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </button>
    )
}
