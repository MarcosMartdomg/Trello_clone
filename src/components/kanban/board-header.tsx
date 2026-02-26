"use client"

import { useMemo, useState } from "react"
import { Filter, Users, Zap, Search, X, Sun, Moon, Globe, Calendar, ArrowUp, ArrowDown, Check } from "lucide-react"
import { useKanbanStore } from "@/lib/store"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { MembersModal } from "./members-modal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function BoardHeader() {
    const {
        searchQuery, setSearchQuery, boards, activeBoardId,
        language, setLanguage, currentView,
        priorityFilter, togglePriorityFilter, clearPriorityFilters,
        tagFilter, toggleTagFilter, clearTagFilters,
        sortBy, setSortBy,
        memberFilter, toggleMemberFilter, clearMemberFilters
    } = useKanbanStore()
    const { theme, setTheme } = useTheme()
    const { t } = useTranslation()
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)

    const activeBoard = useMemo(() => {
        return boards.find(b => b.id === activeBoardId) || null
    }, [boards, activeBoardId])

    const isTasksView = currentView === 'my-tasks'
    const isBoardsListView = currentView === 'boards-list'
    const isInboxView = currentView === 'inbox'
    const isCalendarView = currentView === 'calendar'

    // We used to return null here, but now we want to show the header for tools even if no board title
    // However, if we are in a view that has its own header (like inbox/calendar), we might want to hide the *title* part but keep the header bar?
    // The user request is: "Where it says hello [board name]... should not appear"
    // So we keep the header bar, but render nothing in the left part for these views.

    // If no active board and not in a global view, we might still want to show the header for theme toggles etc?
    // For now, let's stick to existing logic: if nothing to show, return null? 
    // Wait, the user wants to REMOVE the "Hola" part. The header bar itself (with theme toggles) should stay.
    // So we should remove this early return or adapt it.

    // Actually, existing code was: if (!activeBoard && !isTasksView && !isBoardsListView) return null
    // This meant if we are in Inbox/Calendar and have no active board, no header.
    // But if we HAVE an active board (e.g. "Hola"), it shows "Hola" even in Inbox.
    // So we just need to prevent rendering the "activeBoard" block if isInbox or isCalendar.

    return (
        <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-background/80 backdrop-blur-sm shrink-0 z-10 transition-colors duration-300 ease-in-out">
            <div className="flex items-center gap-4">
                {isTasksView ? (
                    <div>
                        <h1 className="text-base font-semibold text-foreground tracking-tight">
                            {t('sidebar.myTasks')}
                        </h1>
                        <p className="text-xs text-muted-foreground lowercase">
                            {t('header.allTasksAssigned')}
                        </p>
                    </div>
                ) : isBoardsListView ? (
                    <div>
                        <h1 className="text-base font-semibold text-foreground tracking-tight">
                            {t('sidebar.myBoards')}
                        </h1>
                        <p className="text-xs text-muted-foreground lowercase">
                            {t('common.manageYourWorkspaces')}
                        </p>
                    </div>
                ) : isInboxView ? (
                    <div>
                        <h1 className="text-base font-semibold text-foreground tracking-tight">
                            {t('sidebar.inbox')}
                        </h1>
                        <p className="text-xs text-muted-foreground lowercase">
                            {t('sidebar.inboxDescription') || "Notificaciones e invitaciones"}
                        </p>
                    </div>
                ) : isCalendarView ? (
                    <div>
                        <h1 className="text-base font-semibold text-foreground tracking-tight">
                            {t('calendar.title')}
                        </h1>
                        <p className="text-xs text-muted-foreground lowercase">
                            {t('calendar.description') || "Gestiona tu agenda y entregas"}
                        </p>
                    </div>
                ) : activeBoard ? (
                    <div>
                        <h1 className="text-base font-semibold text-foreground tracking-tight">
                            {activeBoard.name}
                        </h1>
                        <p className="text-xs text-muted-foreground lowercase">
                            {activeBoard.type === 'shared' ? t('members.shared') : t('members.personal')} {t('header.workspace')}
                        </p>
                    </div>
                ) : null}
            </div>

            <div className="flex items-center gap-2">
                {/* Search & Filter - Visible only on board or my-tasks view */}
                {(currentView === 'board' || currentView === 'my-tasks') && (
                    <>
                        {currentView === 'board' && (
                            <div className="relative flex items-center">
                                <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('header.searchPlaceholder')}
                                    className="pl-9 pr-8 py-1.5 w-64 rounded-lg bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-medium"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Filter & Sort Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button type="button" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-transparent hover:border-border relative">
                                    <Filter className="w-3.5 h-3.5" />
                                    <span className="text-xs">{t('header.filter')}</span>
                                    {isTasksView && (priorityFilter.length > 0 || tagFilter.length > 0) && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl max-h-[80vh] overflow-y-auto">
                                {isTasksView ? (
                                    <>
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-2">
                                            {t('board.priority')}
                                        </DropdownMenuLabel>
                                        {[
                                            { id: 'urgent', color: 'bg-[#fce7f3]' },
                                            { id: 'high', color: 'bg-[#ffedd5]' },
                                            { id: 'medium', color: 'bg-[#fef3c7]' },
                                            { id: 'low', color: 'bg-[#dbeafe]' }
                                        ].map((p) => (
                                            <DropdownMenuItem
                                                key={p.id}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    togglePriorityFilter(p.id)
                                                }}
                                                className="flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer focus:bg-primary/10 transition-colors group"
                                            >
                                                <div className={cn("w-3 h-3 rounded-full border border-black/5", p.color)} />
                                                <span className="text-xs font-bold flex-1 text-foreground">{t(`tags.${p.id}`)}</span>
                                                {priorityFilter.includes(p.id) && (
                                                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                                    </div>
                                                )}
                                            </DropdownMenuItem>
                                        ))}

                                        <DropdownMenuSeparator className="my-1.5 bg-border/40" />

                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-2">
                                            {t('filters.tags')}
                                        </DropdownMenuLabel>

                                        {(() => {
                                            // Get all unique tags from user's tasks
                                            const { boards, tagFilter, toggleTagFilter } = useKanbanStore.getState()
                                            // Logic to find assigned tasks (mimicking MyTasksView)
                                            const userId = boards[0]?.ownerId // Simple fallback for finding current user via board ownership if auth not here, but shopuld use auth if possible
                                            // Better: aggregate all tags from all boards since we don't have easy user access here without context
                                            const allTagsMap = new Map();
                                            boards.forEach(b => b.columns.forEach(c => c.cards.forEach(card => {
                                                card.labels?.forEach(label => {
                                                    if (!allTagsMap.has(label.text)) {
                                                        allTagsMap.set(label.text, label.color);
                                                    }
                                                });
                                            })));
                                            const uniqueTags = Array.from(allTagsMap.entries()).map(([text, color]) => ({ text, color }));

                                            if (uniqueTags.length === 0) {
                                                return <div className="px-2 py-2 text-[10px] text-muted-foreground italic px-3">{t('board.noLabels')}</div>
                                            }

                                            return uniqueTags.map((tag) => (
                                                <DropdownMenuItem
                                                    key={tag.text}
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        toggleTagFilter(tag.text)
                                                    }}
                                                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer focus:bg-primary/10 transition-colors group"
                                                >
                                                    <div className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider", tag.color)} >
                                                        {t(`tags.${tag.text}`) !== `tags.${tag.text}` ? t(`tags.${tag.text}`) : tag.text}
                                                    </div>
                                                    <span className="flex-1"></span>
                                                    {tagFilter.includes(tag.text) && (
                                                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                                        </div>
                                                    )}
                                                </DropdownMenuItem>
                                            ));
                                        })()}

                                        <DropdownMenuSeparator className="my-1.5 bg-border/40" />

                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.preventDefault()
                                                clearPriorityFilters()
                                                clearTagFilters()
                                            }}
                                            className="flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer focus:bg-red-500/10 text-red-500 font-bold transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                            <span className="text-xs">{t('filters.clearFilters')}</span>
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    <>
                                        <DropdownMenuLabel>{t('filters.sortBy')}</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => setSortBy(sortBy === 'newest' ? null : 'newest')}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <Calendar className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                                            <span className="flex-1 font-bold">{t('filters.newest') || "Más nuevo a más antiguo"}</span>
                                            {sortBy === 'newest' && <Check className="w-4 h-4 text-primary" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setSortBy(sortBy === 'oldest' ? null : 'oldest')}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <Calendar className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                                            <span className="flex-1 font-bold">{t('filters.oldest') || "Más antiguo a más nuevo"}</span>
                                            {sortBy === 'oldest' && <Check className="w-4 h-4 text-primary" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setSortBy(sortBy === 'priority' ? null : 'priority')}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <ArrowUp className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                                            <span className="flex-1 font-bold">{t('filters.priority')}</span>
                                            {sortBy === 'priority' && <Check className="w-4 h-4 text-primary" />}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-2">
                                            {t('header.members')}
                                        </DropdownMenuLabel>
                                        {activeBoard?.members?.map((member) => (
                                            <DropdownMenuItem
                                                key={member.id}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    toggleMemberFilter(member.id)
                                                }}
                                                className="flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer focus:bg-primary/10 transition-colors group"
                                            >
                                                <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border/50">
                                                    <AvatarFallback className={cn("text-[8px] font-black text-white", member.color)}>
                                                        {member.avatar}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-bold flex-1 text-foreground">{member.name}</span>
                                                {memberFilter.includes(member.id) && (
                                                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                                    </div>
                                                )}
                                            </DropdownMenuItem>
                                        ))}

                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => {
                                                clearPriorityFilters()
                                                clearTagFilters()
                                                clearMemberFilters()
                                                setSortBy(null)
                                            }}
                                            className="text-red-500 focus:text-red-500 font-bold flex items-center gap-2 cursor-pointer"
                                        >
                                            <X className="h-4 w-4" />
                                            <span>{t('filters.clearFilters')}</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}

                {/* Members button & Avatars */}
                {!isTasksView && activeBoard?.type === 'shared' && (
                    <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-secondary/30 border border-border/50">
                        <div className="flex -space-x-2 mr-2 ml-1">
                            {activeBoard.members?.slice(0, 3).map((member) => (
                                <Avatar key={member.id} className="h-6 w-6 border-2 border-background ring-1 ring-border/50">
                                    <AvatarFallback className={cn("text-[8px] font-black text-white", member.color)}>
                                        {member.avatar}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {activeBoard.members && activeBoard.members.length > 3 && (
                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-secondary border-2 border-background text-[8px] font-black text-muted-foreground ring-1 ring-border/50">
                                    +{activeBoard.members.length - 3}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMembersModalOpen(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-background transition-all"
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{t('header.members')}</span>
                        </button>
                    </div>
                )}

                {/* Automations */}


                <div className="h-4 w-[1px] bg-border mx-1" />

                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-9 h-9 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-300"
                >
                    {theme === "dark" ? (
                        <Sun className="w-[18px] h-[18px] transition-all hover:rotate-45" />
                    ) : (
                        <Moon className="w-[18px] h-[18px] transition-all hover:-rotate-12" />
                    )}
                </Button>

                {/* Language Switcher */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                        >
                            <Globe className="w-[18px] h-[18px]" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card/80 backdrop-blur-xl border-white/10 rounded-2xl min-w-[140px] p-1.5">
                        <DropdownMenuItem
                            onClick={() => setLanguage('es')}
                            className={cn(
                                "gap-3 py-2.5 px-3 focus:bg-primary/20 focus:text-primary cursor-pointer rounded-xl font-medium transition-colors mb-1",
                                language === 'es' && "text-primary bg-primary/10"
                            )}
                        >
                            <img src="https://flagcdn.com/w40/es.png" alt="Español" className="w-5 h-auto rounded-sm shadow-sm" />
                            <span className="text-sm">Español</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setLanguage('en')}
                            className={cn(
                                "gap-3 py-2.5 px-3 focus:bg-primary/20 focus:text-primary cursor-pointer rounded-xl font-medium transition-colors",
                                language === 'en' && "text-primary bg-primary/10"
                            )}
                        >
                            <img src="https://flagcdn.com/w40/us.png" alt="English" className="w-5 h-auto rounded-sm shadow-sm" />
                            <span className="text-sm">English</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <MembersModal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
            />
        </header>
    )
}
