"use client"

import { useKanbanStore } from "@/lib/store"
import { useAuth } from "@/components/auth/auth-provider"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { Calendar, Clock, Layout, ChevronRight, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"
import { CardDetailsModal } from "./card-details-modal"
import { KanbanCard } from "@/lib/kanban-data"
import confetti from 'canvas-confetti'

export function MyTasksView() {
    const { boards, setActiveBoard, updateCard } = useKanbanStore()
    const { user } = useAuth()
    const { t } = useTranslation()
    const [selectedCard, setSelectedCard] = useState<(KanbanCard & { columnTitle: string }) | null>(null)
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)

    const toggleAllCheckitems = (e: React.MouseEvent, card: KanbanCard) => {
        e.stopPropagation()
        const allCompleted = card.checklist?.every(i => i.completed)
        const newChecklist = (card.checklist || []).map(i => ({
            ...i,
            completed: !allCompleted
        }))

        // Trigger confetti if we're marking as completed
        if (!allCompleted) {
            // Calculate relative origin from click coordinates
            const x = e.clientX / window.innerWidth
            const y = e.clientY / window.innerHeight

            confetti({
                particleCount: 100,
                spread: 60,
                origin: { x, y },
                colors: ['#000000', '#333333', '#666666', '#000000'],
                ticks: 200,
                gravity: 1.2,
                scalar: 0.8
            })
        }

        updateCard(card.id, { checklist: newChecklist })
    }

    if (!user) return null

    // Get all tasks assigned to the current user OR in their personal boards
    const { priorityFilter, tagFilter } = useKanbanStore()

    const tasksPerBoard = boards.map(board => {
        const isOwnerOfPersonalBoard = board.type === 'personal' && board.ownerId === user.id;

        const filteredTasks = board.columns.flatMap(col =>
            col.cards.filter(card => {
                const isAssigned = isOwnerOfPersonalBoard || card.members?.some(m => m.id === user.id);
                const matchesPriority = priorityFilter.length === 0 || (card.priority && priorityFilter.includes(card.priority));
                const matchesTags = tagFilter.length === 0 || card.labels?.some(l => tagFilter.includes(l.text));

                return isAssigned && matchesPriority && matchesTags;
            }).map(card => ({
                ...card,
                columnTitle: col.title
            }))
        )
        return {
            ...board,
            tasks: filteredTasks
        }
    }).filter(board => board.tasks.length > 0)

    const totalTasks = tasksPerBoard.reduce((acc, board) => acc + board.tasks.length, 0)

    return (
        <div className="flex-1 overflow-y-auto bg-background/50 p-8 space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">{t('sidebar.myTasks')}</h1>
                <p className="text-muted-foreground font-medium">
                    {totalTasks > 0
                        ? t('board.youHaveTasks', { count: totalTasks.toString() })
                        : t('board.noTasksAssigned')
                    }
                </p>
            </header>

            {tasksPerBoard.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckSquare className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{t('board.allCaughtUp')}</h3>
                        <p className="text-muted-foreground">{t('board.noTasksAssignedDesc')}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-10">
                    {tasksPerBoard.map(board => (
                        <section key={board.id} className="space-y-4">
                            <div className="flex items-center gap-3 px-1">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Layout className="w-4 h-4 text-primary" />
                                </div>
                                <h2 className="text-lg font-bold tracking-tight">{board.name}</h2>
                                <span className="text-xs font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                    {board.tasks.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {board.tasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => {
                                            setActiveBoard(board.id)
                                            setSelectedBoardId(board.id)
                                            setSelectedCard(task as KanbanCard & { columnTitle: string })
                                        }}
                                        className={cn(
                                            "group bg-card hover:bg-accent/5 cursor-pointer rounded-2xl border border-border/50 p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                                            task.checklist?.every(i => i.completed) && task.checklist?.length > 0 && "opacity-75 bg-secondary/20"
                                        )}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div
                                                    className="pt-1"
                                                    onClick={(e) => toggleAllCheckitems(e as any, task as KanbanCard)}
                                                >
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                        task.checklist?.every(i => i.completed) && task.checklist?.length > 0
                                                            ? "bg-primary border-primary text-primary-foreground"
                                                            : "border-border hover:border-primary/50"
                                                    )}>
                                                        {task.checklist?.every(i => i.completed) && task.checklist?.length > 0 && (
                                                            <CheckSquare className="w-3.5 h-3.5" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/70">
                                                        <span>{task.columnTitle}</span>
                                                        {task.checklist?.every(i => i.completed) && task.checklist?.length > 0 && (
                                                            <span className="bg-foreground text-background px-1.5 py-0.5 rounded ml-1 tracking-tighter">Hecha</span>
                                                        )}
                                                    </div>
                                                    <h4 className={cn(
                                                        "font-bold text-lg leading-snug group-hover:text-primary transition-colors",
                                                        task.checklist?.every(i => i.completed) && task.checklist?.length > 0 && "line-through text-muted-foreground opacity-50"
                                                    )}>
                                                        {task.title}
                                                    </h4>
                                                </div>
                                            </div>
                                            {task.priority && (
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-black/5",
                                                    task.priority === 'urgent' && "bg-[#fce7f3] text-pink-700",
                                                    task.priority === 'high' && "bg-[#ffedd5] text-orange-700",
                                                    task.priority === 'medium' && "bg-[#fef3c7] text-amber-700",
                                                    task.priority === 'low' && "bg-[#dbeafe] text-blue-700"
                                                )}>
                                                    {t(`tags.${task.priority}`)}
                                                </span>
                                            )}
                                        </div>

                                        {task.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                {task.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-4 text-muted-foreground">
                                                {task.due_date && (
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 text-xs font-bold",
                                                        new Date(task.due_date) < new Date() ? "text-red-500" : ""
                                                    )}>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {format(new Date(task.due_date), "MMM d")}
                                                    </div>
                                                )}
                                                {task.checklist && task.checklist.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                                        <CheckSquare className="w-3.5 h-3.5" />
                                                        {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex -space-x-2">
                                                {task.members?.map(member => (
                                                    <Avatar key={member.id} className="h-6 w-6 border-2 border-card ring-1 ring-border/50">
                                                        <AvatarFallback className="text-[8px] font-black bg-primary/20 text-primary">
                                                            {member.name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {selectedCard && (
                <CardDetailsModal
                    card={selectedCard}
                    columnTitle={selectedCard.columnTitle}
                    isOpen={!!selectedCard}
                    isReadOnly={true}
                    onClose={() => {
                        setSelectedCard(null)
                        setSelectedBoardId(null)
                    }}
                />
            )}
        </div>
    )
}

function CheckSquare(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
