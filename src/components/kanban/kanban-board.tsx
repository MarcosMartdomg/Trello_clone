
"use client"

import { useMemo, useState, useEffect } from "react"
import { Plus, LayoutPanelLeft, ShieldAlert, Check, X, Users } from "lucide-react"
import { DragDropContext, DropResult } from "@hello-pangea/dnd"
import { useKanbanStore } from "@/lib/store"
import { KanbanColumnComponent } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { TagFilters } from "./board-filters"
import { Button } from "@/components/ui/button"
import { CreateBoardModal } from "./create-board-modal"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/components/auth/auth-provider"
import type { KanbanCard as KanbanCardType, KanbanColumn as KanbanColumnType } from "@/lib/kanban-data"

export function KanbanBoard() {
    const { boards, activeBoardId, moveCard, addColumn, searchQuery, tagFilter, priorityFilter, memberFilter, sortBy, createBoard, acceptInvitation, declineInvitation } = useKanbanStore()
    const { user } = useAuth()
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        moveCard(
            draggableId,
            source.droppableId,
            destination.droppableId,
            source.index,
            destination.index
        )
    }

    const [isMounted, setIsMounted] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isAddingColumn, setIsAddingColumn] = useState(false)
    const [newColumnTitle, setNewColumnTitle] = useState("")

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const activeBoard = useMemo(() => {
        return boards.find(b => b.id === activeBoardId) || null
    }, [boards, activeBoardId])

    const isPending = useMemo(() => {
        if (!activeBoard || !user) return false
        if (activeBoard.ownerId === user.id) return false
        const memberEntry = activeBoard.members.find(m => m.id === user.id)
        return memberEntry?.status !== 'accepted'
    }, [activeBoard, user])

    const { t } = useTranslation()

    const filteredColumns = useMemo(() => {
        if (!activeBoard) return []

        const priorityOrder: Record<string, number> = {
            urgent: 0,
            high: 1,
            medium: 2,
            low: 3
        };

        return activeBoard.columns.map((col) => {
            const cards = col.cards.filter((card) => {
                const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    card.description.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesTags = tagFilter.length === 0 ||
                    card.labels.some(l => tagFilter.includes(l.text));
                const matchesPriority = priorityFilter.length === 0 ||
                    priorityFilter.includes(card.priority);
                const matchesMembers = memberFilter.length === 0 ||
                    card.members.some(m => memberFilter.includes(m.id));
                return matchesSearch && matchesTags && matchesPriority && matchesMembers;
            });

            // Sorting logic
            if (sortBy === 'priority') {
                cards.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            } else if (sortBy === 'date') {
                cards.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA; // Newest first
                });
            }

            return {
                ...col,
                cards
            };
        })
    }, [activeBoard, searchQuery, tagFilter, priorityFilter, memberFilter, sortBy])

    if (!isMounted) return null

    if (!activeBoard) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-card/10">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                    <LayoutPanelLeft className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">{t('board.welcomeTitle')}</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    {t('board.welcomeSub')}
                </p>
                <Button
                    size="lg"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2 shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    {t('board.firstBoard')}
                </Button>
            </div>
        )
    }

    if (isPending) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10 animate-pulse">
                        <ShieldAlert className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-muted-foreground" />
                    </div>
                </div>

                <h1 className="text-3xl font-black tracking-tight mb-3">
                    {t('members.invitationFrom', { name: activeBoard.name })}
                </h1>
                <p className="text-muted-foreground max-w-md mb-10 leading-relaxed font-medium">
                    Has sido invitado a colaborar en este tablero. Para ver las tareas y participar, primero debes aceptar la invitación.
                </p>

                <div className="flex items-center gap-4">
                    <Button
                        size="lg"
                        variant="outline"
                        className="h-12 px-8 rounded-xl font-bold border-2 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all"
                        onClick={() => declineInvitation(activeBoard.id, user!.id)}
                    >
                        <X className="w-4 h-4 mr-2" />
                        {t('members.decline')}
                    </Button>
                    <Button
                        size="lg"
                        className="h-12 px-10 rounded-xl font-black shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                        onClick={() => acceptInvitation(activeBoard.id, user!.id)}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        {t('members.accept')}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col h-full bg-background/50">
            <TagFilters />

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 overflow-x-auto flex-1 items-start p-6 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
                    {filteredColumns.map((column) => (
                        <KanbanColumnComponent key={column.id} column={column} />
                    ))}

                    {isAddingColumn ? (
                        <div className="w-[320px] shrink-0 p-3 rounded-2xl bg-column border border-primary/30 shadow-lg animate-in fade-in zoom-in-95 duration-200 h-fit">
                            <input
                                autoFocus
                                value={newColumnTitle}
                                onChange={(e) => setNewColumnTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        setIsAddingColumn(false)
                                        setNewColumnTitle("")
                                    }
                                    if (e.key === "Enter") {
                                        if (newColumnTitle.trim()) {
                                            addColumn(newColumnTitle.trim())
                                            setNewColumnTitle("")
                                            setIsAddingColumn(false)
                                        }
                                    }
                                }}
                                placeholder={t('board.columnTitle')}
                                className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none px-1 py-1"
                            />
                            <div className="flex items-center gap-2 mt-3 justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsAddingColumn(false)
                                        setNewColumnTitle("")
                                    }}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        if (newColumnTitle.trim()) {
                                            addColumn(newColumnTitle.trim())
                                            setNewColumnTitle("")
                                            setIsAddingColumn(false)
                                        }
                                    }}
                                >
                                    {t('board.addColumn')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsAddingColumn(true)}
                            className="flex items-center gap-2 w-[300px] shrink-0 h-12 px-4 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-column transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t('board.addColumn')}</span>
                        </button>
                    )}
                </div>
            </DragDropContext>

            <CreateBoardModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={(name) => createBoard(name, user!.id)}
            />
        </div >
    )
}
