"use client"

import React, { useState } from "react"
import {
    Inbox,
    Bell,
    UserPlus,
    Check,
    X,
    Clock,
    AlertCircle,
    Layout,
    Calendar as CalendarIcon,
    ArrowRight,
    Sparkles,
    Zap
} from "lucide-react"
import { useKanbanStore } from "@/lib/store"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function InboxView() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const {
        boards,
        invitations,
        acceptInvitation,
        declineInvitation,
        setCurrentView,
        setActiveBoard
    } = useKanbanStore()
    const [activeTab, setActiveTab] = useState<'notifications' | 'invitations'>('notifications')

    // Recommendations Logic - Include cards assigned to me OR all cards from my personal boards
    const myCards = boards.flatMap(board => {
        const isOwner = board.ownerId === user?.id;
        const isPersonal = board.type === 'personal';

        return board.columns.flatMap(column =>
            column.cards.filter(card => {
                const isMember = card.members.some(m => m.id === user?.id);
                return isMember || (isOwner && isPersonal);
            })
        );
    })

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const today = new Date(now)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const sevenDaysFromNow = new Date(now)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const recommendations = myCards.map(card => {
        const hasChecklist = card.checklist && card.checklist.length > 0
        const pendingChecklistCount = hasChecklist ? card.checklist.filter((i: any) => !i.completed).length : 0
        const isCompleted = hasChecklist && pendingChecklistCount === 0

        const dueDate = card.due_date ? new Date(card.due_date) : null
        if (dueDate) dueDate.setHours(0, 0, 0, 0)

        let alertType: 'overdue' | 'today' | 'tomorrow' | 'soon' | 'priority' | null = null

        if (dueDate) {
            if (dueDate < today && !isCompleted) {
                alertType = 'overdue'
            } else if (dueDate.getTime() === today.getTime() && !isCompleted) {
                alertType = 'today'
            } else if (dueDate.getTime() === tomorrow.getTime() && !isCompleted) {
                alertType = 'tomorrow'
            } else if (dueDate <= sevenDaysFromNow && !isCompleted) {
                alertType = 'soon'
            }
        }

        if (!alertType && (card.priority === 'urgent' || card.priority === 'high') && !isCompleted) {
            alertType = 'priority'
        }

        return {
            ...card,
            alertType,
            pendingChecklistCount,
            totalChecklistCount: card.checklist?.length || 0
        }
    }).filter(c => c.alertType !== null).sort((a, b) => {
        const order = { overdue: 0, today: 1, tomorrow: 2, soon: 3, priority: 4 }
        return (order[a.alertType as keyof typeof order] ?? 5) - (order[b.alertType as keyof typeof order] ?? 5)
    })

    const handleAccept = async (boardId: string) => {
        if (user) await acceptInvitation(boardId, user.id)
    }

    const handleDecline = async (boardId: string) => {
        if (user) await declineInvitation(boardId, user.id)
    }

    const navigateToCard = (cardId: string) => {
        const board = boards.find(b => b.columns.some(col => col.cards.some(c => c.id === cardId)))
        if (board) {
            setActiveBoard(board.id)
            setCurrentView('board')
        }
    }

    return (
        <div className="flex-1 overflow-y-auto bg-background p-8 space-y-12">
            {/* Header: Following BoardsListView style */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-border/60">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                            <Inbox className="w-5 h-5" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                            {t('sidebar.inbox')}
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-medium pl-[52px]">
                        {t('sidebar.inboxDescription') || "Centro de notificaciones e invitaciones."}
                    </p>
                </div>

                <div className="flex gap-1 bg-secondary p-1 rounded-2xl border border-border/50 shrink-0 h-fit">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                            activeTab === 'notifications'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <Bell className="w-4 h-4" />
                        {t('board.activity')}
                        {recommendations.length > 0 && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('invitations')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-200",
                            activeTab === 'invitations'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <UserPlus className="w-4 h-4" />
                        {t('header.members')}
                        {invitations.length > 0 && (
                            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                                {invitations.length}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    {activeTab === 'notifications' ? (
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 px-1">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight">{t('members.recommendations')}</h2>
                                <span className="text-xs font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                    {recommendations.length}
                                </span>
                            </div>

                            <div className="grid gap-6">
                                {recommendations.map(card => (
                                    <RecommendationCard
                                        key={card.id}
                                        card={card}
                                        onNavigate={() => navigateToCard(card.id)}
                                        t={t}
                                    />
                                ))}
                                {recommendations.length === 0 && (
                                    <div className="py-24 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                        <Bell className="w-12 h-12 text-muted-foreground/30" />
                                        <p className="font-medium text-muted-foreground">{t('members.noNotifications')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 px-1">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <UserPlus className="w-4 h-4 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight">{t('sidebar.sharedBoards')}</h2>
                                <span className="text-xs font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                    {invitations.length}
                                </span>
                            </div>

                            <div className="grid gap-6">
                                {invitations.map(invite => (
                                    <InvitationCard
                                        key={invite.id}
                                        invite={invite}
                                        onAccept={() => handleAccept(invite.board_id)}
                                        onDecline={() => handleDecline(invite.board_id)}
                                        t={t}
                                    />
                                ))}
                                {invitations.length === 0 && (
                                    <div className="py-24 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                        <UserPlus className="w-12 h-12 text-muted-foreground/30" />
                                        <p className="font-medium text-muted-foreground">{t('members.noInvitations')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Lateral Summary View */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-2xl shadow-primary/5 transition-all hover:border-primary/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-primary" />
                            </div>
                            <h4 className="font-bold text-xl tracking-tight">Estado Actual</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium mb-8">
                            {recommendations.length > 0 ? (
                                <>
                                    Tienes <span className="text-foreground font-black italic">{recommendations.length}</span> tareas activas que requieren revisión prioritaria.
                                </>
                            ) : (
                                "No tienes tareas pendientes que requieran atención inmediata."
                            )}
                        </p>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-6 border-t border-border/50">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-destructive uppercase">Atascado</span>
                                <p className="text-2xl font-black text-destructive">{recommendations.filter(c => c.alertType === 'overdue').length}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-orange-500 uppercase">Hoy / Mañana</span>
                                <p className="text-2xl font-black text-orange-500">{recommendations.filter(c => c.alertType === 'today' || c.alertType === 'tomorrow').length}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-muted-foreground uppercase">{t('board.priority')}</span>
                                <p className="text-2xl font-black">{recommendations.filter(c => c.alertType === 'priority').length}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-muted-foreground uppercase">{t('members.pending')}</span>
                                <p className="text-2xl font-black italic">{invitations.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function RecommendationCard({ card, onNavigate, t }: { card: any, onNavigate: () => void, t: any }) {
    const isOverdue = card.alertType === 'overdue'
    const isToday = card.alertType === 'today'
    const isTomorrow = card.alertType === 'tomorrow'

    let label = t('members.dueSoon')
    let labelClass = "bg-secondary text-muted-foreground border-border/50"
    let icon = <Clock className="w-5 h-5" />
    let colorScheme = "primary" // Default

    if (isOverdue) {
        label = t('members.overdue')
        labelClass = "bg-destructive/10 text-destructive border-destructive/20"
        icon = <Zap className="w-5 h-5" />
        colorScheme = "destructive"
    } else if (isToday) {
        label = t('members.dueToday')
        labelClass = "bg-orange-500/10 text-orange-600 border-orange-500/20"
        icon = <AlertCircle className="w-5 h-5" />
        colorScheme = "orange"
    } else if (isTomorrow) {
        label = t('members.dueTomorrow')
        labelClass = "bg-blue-500/10 text-blue-600 border-blue-500/20"
        colorScheme = "blue"
    } else if (card.alertType === 'priority') {
        label = t('members.highPriority')
        labelClass = "bg-destructive/10 text-destructive border-destructive/20"
        colorScheme = "destructive"
    }

    const progress = card.totalChecklistCount > 0
        ? Math.round(((card.totalChecklistCount - card.pendingChecklistCount) / card.totalChecklistCount) * 100)
        : 0

    return (
        <button
            onClick={onNavigate}
            className={cn(
                "group relative flex flex-col items-start gap-6 p-8 bg-card border border-border/50 rounded-[32px] transition-all duration-500",
                "hover:border-primary/30 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1",
                isOverdue && "bg-destructive/[0.02] border-destructive/10 hover:border-destructive/30"
            )}
        >
            {/* Background Decoration */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 blur-[64px] rounded-full opacity-5 transition-opacity group-hover:opacity-10",
                colorScheme === "destructive" ? "bg-destructive" : "bg-primary"
            )} />

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full relative z-10">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110 shadow-sm",
                    colorScheme === "destructive" ? "bg-destructive/10 text-destructive border-destructive/20" :
                        colorScheme === "orange" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                            colorScheme === "blue" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                "bg-primary/10 text-primary border-primary/20",
                    "group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                )}>
                    {icon}
                </div>

                <div className="flex-1 space-y-4 w-full">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm",
                            labelClass
                        )}>
                            {label}
                        </span>

                        {card.due_date && (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-secondary/50 border border-border/50 text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(card.due_date).toLocaleDateString()}
                            </div>
                        )}

                        {card.priority === 'urgent' && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20">
                                {t('board.priorityUrgent')}
                            </span>
                        )}
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <h4 className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors tracking-tight">
                                {card.title}
                            </h4>
                            <div className="hidden md:flex p-3 rounded-2xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                        {card.description ? (
                            <p className="text-sm text-muted-foreground font-medium line-clamp-1 opacity-70">
                                {card.description}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground font-medium italic opacity-40">
                                {t('common.noDescription')}
                            </p>
                        )}
                    </div>

                    {card.totalChecklistCount > 0 && (
                        <div className="pt-2 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{t('board.progress')}</span>
                                </div>
                                <span>{card.totalChecklistCount - card.pendingChecklistCount} / {card.totalChecklistCount}</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/30">
                                <div
                                    className={cn(progress === 100 ? "bg-green-500" : "bg-primary", "h-full transition-all duration-700 ease-out")}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isOverdue && card.pendingChecklistCount > 0 && (
                <div className="mt-4 pt-4 border-t border-destructive/10 w-full flex items-center justify-between">
                    <span className="text-[11px] font-black text-destructive uppercase tracking-widest animate-pulse flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        {t('members.finishTasksAction')}
                    </span>
                    <span className="text-[10px] font-bold text-destructive/60">Atrasada por {Math.floor((new Date().getTime() - new Date(card.due_date).getTime()) / (1000 * 60 * 60 * 24))} días</span>
                </div>
            )}
        </button>
    )
}

function InvitationCard({ invite, onAccept, onDecline, t }: { invite: any, onAccept: () => Promise<void>, onDecline: () => Promise<void>, t: any }) {
    const [isAccepting, setIsAccepting] = useState(false)
    const [isDeclining, setIsDeclining] = useState(false)

    const handleAccept = async () => {
        setIsAccepting(true)
        try {
            await onAccept()
        } finally {
            setIsAccepting(false)
        }
    }

    const handleDecline = async () => {
        setIsDeclining(true)
        try {
            await onDecline()
        } finally {
            setIsDeclining(false)
        }
    }

    return (
        <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-card border border-border/50 rounded-3xl shadow-sm transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-border/50">
                <Layout className="w-8 h-8 text-primary" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
                <h4 className="text-2xl font-extrabold text-foreground tracking-tight">
                    {t('members.invitationFrom', { name: invite.boards?.name })}
                </h4>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    Invitado a colaborar por <span className="text-foreground font-bold">el administrador</span> del tablero.
                </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                    onClick={handleDecline}
                    disabled={isAccepting || isDeclining}
                    className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-secondary text-muted-foreground font-bold text-sm hover:bg-destructive/10 hover:text-destructive border border-border/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDeclining ? (
                        <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin inline-block mr-2" />
                    ) : (
                        <X className="w-4 h-4 inline mr-2" />
                    )}
                    {t('members.decline')}
                </button>
                <button
                    onClick={handleAccept}
                    disabled={isAccepting || isDeclining}
                    className="flex-1 md:flex-none px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-black text-sm hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                >
                    {isAccepting ? (
                        <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin inline-block mr-2" />
                    ) : (
                        <Check className="w-4 h-4 inline mr-2" />
                    )}
                    {t('members.accept')}
                </button>
            </div>
        </div>
    )
}
