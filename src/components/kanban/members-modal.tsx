"use client"

import React, { useState, useEffect } from "react"
import { Users, X, Search, UserPlus, Trash2, Check, Clock } from "lucide-react"
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
import { api } from "@/lib/api"
import { useTranslation } from "@/hooks/use-translation"
import { useAuth } from "@/components/auth/auth-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface MembersModalProps {
    isOpen: boolean
    onClose: () => void
}

export function MembersModal({ isOpen, onClose }: MembersModalProps) {
    const { t } = useTranslation()
    const { user } = useAuth()
    const { boards, activeBoardId, addBoardMember, removeBoardMember } = useKanbanStore()
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [memberProfiles, setMemberProfiles] = useState<any[]>([])
    const [sentInvitations, setSentInvitations] = useState<Set<string>>(new Set())

    const currentBoard = boards.find(b => b.id === activeBoardId)

    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([])
                return
            }
            setIsSearching(true)
            try {
                const results = await api.searchUsers(searchQuery)
                setSearchResults(results)
            } catch (error) {
                console.error("MembersModal: Search error", error)
            } finally {
                setIsSearching(false)
            }
        }

        const timer = setTimeout(performSearch, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Load member profiles when board changes
    useEffect(() => {
        const loadProfiles = async () => {
            if (!currentBoard?.members?.length) {
                setMemberProfiles([])
                return
            }
            try {
                const profiles = await api.fetchProfiles(currentBoard.members.map(m => m.id).join(','))
                setMemberProfiles(profiles)
            } catch (error) {
                console.error("MembersModal: Load profiles error", error)
            }
        }
        loadProfiles()
    }, [currentBoard?.members])

    if (!currentBoard) return null

    const boardMembers = currentBoard.members || []
    const boardMembersIds = new Set(boardMembers.map(m => m.id))

    const handleAddMember = async (userId: string) => {
        try {
            await addBoardMember(currentBoard.id, userId)
            setSentInvitations(prev => new Set(prev).add(userId))
        } catch (error) {
            console.error("MembersModal: Error adding member", error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl">
                <DialogHeader className="px-8 pt-8 pb-6 bg-slate-900/5 border-b border-border/50">
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
                            {memberProfiles.map((member) => {
                                const isPending = boardMembers.find(m => m.id === member.id)?.status === 'pending'

                                return (
                                    <div key={member.id} className="flex items-center justify-between group p-3 rounded-2xl bg-secondary/20 border border-border/40 hover:bg-secondary/30 transition-all duration-200">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-slate-900/10 transition-transform group-hover:scale-105">
                                                <AvatarFallback className={cn("text-[10px] font-black text-white shadow-inner bg-slate-900")}>
                                                    {member.full_name?.[0]?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-foreground/90">
                                                        {member.full_name}
                                                        {member.id === user?.id && <span className="ml-1.5 text-muted-foreground/60 font-medium">({t('sidebar.user')})</span>}
                                                    </p>
                                                    {isPending && (
                                                        <span className="text-[9px] font-black uppercase bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                            {t('members.pending')}
                                                        </span>
                                                    )}
                                                </div>
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
                                )
                            })}
                            {memberProfiles.length === 0 && (
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
                            {searchResults
                                .filter(u => u.id !== user?.id)
                                .map((user) => {
                                    const isMember = boardMembersIds.has(user.id)
                                    const isSent = sentInvitations.has(user.id)
                                    const memberData = boardMembers.find(m => m.id === user.id)
                                    const isPending = memberData?.status === 'pending' || isSent

                                    return (
                                        <div
                                            key={user.id}
                                            className={cn(
                                                "flex items-center justify-between w-full p-2.5 rounded-xl group transition-all duration-200",
                                                isPending || (isMember && !isPending) ? "bg-secondary/10 cursor-default" : "hover:bg-primary/5 cursor-pointer active:scale-[0.98]"
                                            )}
                                            onClick={() => !isMember && !isSent && handleAddMember(user.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className={cn("text-[9px] font-black text-white bg-primary/20 text-primary")}>
                                                        {user.full_name?.[0]?.toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground/80 group-hover:text-primary transition-colors">{user.full_name}</p>
                                                    {user.email && <p className="text-[10px] text-muted-foreground">{user.email}</p>}
                                                </div>
                                            </div>

                                            {isSent ? (
                                                <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                                                    <Check className="w-3.5 h-3.5" />
                                                    {t('members.requestSent')}
                                                </div>
                                            ) : isPending ? (
                                                <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {t('members.pending')}
                                                </div>
                                            ) : isMember ? (
                                                <div className="text-[10px] font-black uppercase text-muted-foreground/40 px-2 py-1">
                                                    {t('members.alreadyInvited')}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5 text-primary opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                                                    <UserPlus className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            {!searchQuery && (
                                <p className="text-xs text-muted-foreground italic text-center py-6 border border-dashed border-border/40 rounded-2xl bg-secondary/5">
                                    {t('members.searchToInvite')}
                                </p>
                            )}
                            {searchResults.length === 0 && searchQuery && !isSearching && (
                                <p className="text-xs text-muted-foreground italic text-center py-4">
                                    {t('members.noResults', { query: searchQuery })}
                                </p>
                            )}
                            {isSearching && (
                                <p className="text-xs text-muted-foreground italic text-center py-4">
                                    {t('common.searching')}...
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
