"use client"

import React, { useState } from "react"
import { Users, X, Search, UserPlus, Trash2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useKanbanStore } from "@/lib/store"
import { mockMembers } from "@/lib/kanban-data"
import { useTranslation } from "@/hooks/use-translation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface MembersModalProps {
    isOpen: boolean
    onClose: () => void
}

export function MembersModal({ isOpen, onClose }: MembersModalProps) {
    const { t } = useTranslation()
    const { boards, activeBoardId, addBoardMember, removeBoardMember } = useKanbanStore()
    const [searchQuery, setSearchQuery] = useState("")

    const currentBoard = boards.find(b => b.id === activeBoardId)
    if (!currentBoard) return null

    const boardMembersIds = new Set((currentBoard.members || []).map(m => m.id))

    // Only show results if there is a search query (mimicking database search)
    const availableToInvite = searchQuery.trim() === ""
        ? []
        : mockMembers.filter(m =>
            !boardMembersIds.has(m.id) &&
            m.name.toLowerCase().includes(searchQuery.toLowerCase())
        )

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl">
                <DialogHeader className="px-8 pt-8 pb-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-b border-border/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">{t('members.title')}</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground/80 font-medium">
                                {t('members.subtitle')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8">
                    {/* Active Members section */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                            <span>{t('sidebar.user')}s</span>
                            <span className="h-px flex-1 bg-border/40"></span>
                        </h4>

                        <div className="space-y-3">
                            {(currentBoard.members || []).map((member) => (
                                <div key={member.id} className="flex items-center justify-between group p-3 rounded-2xl bg-secondary/20 border border-border/40 hover:bg-secondary/30 transition-all duration-200">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-primary/10 transition-transform group-hover:scale-105">
                                            <AvatarFallback className={cn("text-[10px] font-black text-white shadow-inner", member.color)}>
                                                {member.avatar}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-bold text-foreground/90">{member.name}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeBoardMember(currentBoard.id, member.id)}
                                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {(!currentBoard.members || currentBoard.members.length === 0) && (
                                <p className="text-xs text-muted-foreground italic text-center py-4 bg-secondary/10 rounded-2xl border border-dashed border-border/60">
                                    {t('members.noMembers')}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Invite section */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                            <span>{t('members.invite')}</span>
                            <span className="h-px flex-1 bg-border/40"></span>
                        </h4>

                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            <Input
                                placeholder={t('members.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 bg-secondary/30 border-border/40 focus-visible:ring-primary/20 rounded-xl text-sm"
                            />
                        </div>

                        <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-primary/10">
                            {availableToInvite.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => addBoardMember(currentBoard.id, member)}
                                    className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-primary/5 group transition-all duration-200 active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className={cn("text-[9px] font-black text-white", member.color)}>
                                                {member.avatar}
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className="text-sm font-semibold text-foreground/80 group-hover:text-primary transition-colors">{member.name}</p>
                                    </div>
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 text-primary opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                                        <UserPlus className="w-4 h-4" />
                                    </div>
                                </button>
                            ))}
                            {!searchQuery && (
                                <p className="text-xs text-muted-foreground italic text-center py-6 border border-dashed border-border/40 rounded-2xl bg-secondary/5">
                                    {t('members.searchToInvite')}
                                </p>
                            )}
                            {availableToInvite.length === 0 && searchQuery && (
                                <p className="text-xs text-muted-foreground italic text-center py-4">
                                    {t('members.noResults', { query: searchQuery })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 border-t border-border/40 bg-secondary/10 flex justify-end">
                    <Button
                        onClick={onClose}
                        className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {t('common.ready')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
