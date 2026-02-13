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

    // Recommendations Logic
    const allCards = boards.flatMap(b => b.columns.flatMap(c => c.cards))
    const myCards = allCards.filter(c => c.members.some(m => m.id === user?.id))

    const now = new Date()
    const fortyEightHoursFromNow = new Date(now.getTime() + (48 * 60 * 60 * 1000))

    const recommendations = myCards.filter(card => {
        const isUrgent = card.priority === 'urgent' || card.priority === 'high'
        const isDueSoon = card.due_date && new Date(card.due_date) <= fortyEightHoursFromNow
        return isUrgent || isDueSoon
    }).sort((a, b) => {
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
        if (a.priority !== 'urgent' && b.priority === 'urgent') return 1
        return 0
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
                        {t('sidebar.inboxDescription') || "Centro de notificaciones e invitaciones del equipo."}
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
                                <h2 className="text-xl font-bold tracking-tight">{t('sidebar.team')}</h2>
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
                            Tienes <span className="text-foreground font-black italic">{recommendations.length}</span> tareas activas que requieren revisión. Los tableros compartidos aparecerán en tu lista una vez aceptes las invitaciones.
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-muted-foreground uppercase">{t('board.priority')}</span>
                                <p className="text-2xl font-black">{recommendations.filter(c => c.priority === 'urgent' || c.priority === 'high').length}</p>
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
    const isUrgent = card.priority === 'urgent' || card.priority === 'high'

    return (
        <button
            onClick={onNavigate}
            className="group flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-card border border-border/50 rounded-3xl hover:border-primary/20 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 text-left overflow-hidden"
        >
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-border/50 transition-all group-hover:bg-primary group-hover:text-primary-foreground",
                isUrgent ? "bg-destructive/5 text-destructive border-destructive/20" : "bg-primary/5 text-primary border-primary/20"
            )}>
                {isUrgent ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>

            <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-3">
                    <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border",
                        isUrgent
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-secondary text-muted-foreground border-border/50"
                    )}>
                        {isUrgent ? t('members.highPriority') : t('members.dueSoon')}
                    </span>
                    {card.due_date && (
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
                            <CalendarIcon className="w-3 h-3" />
                            {new Date(card.due_date).toLocaleDateString()}
                        </span>
                    )}
                </div>
                <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors pr-8">
                    {card.title}
                </h4>
                <p className="text-xs text-muted-foreground font-medium line-clamp-1 italic">
                    {card.description || t('common.noDescription')}
                </p>
            </div>

            <div className="hidden md:flex p-2.5 rounded-xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <ArrowRight className="w-4 h-4" />
            </div>
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
