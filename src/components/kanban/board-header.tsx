"use client"

import { useMemo, useState } from "react"
import { Filter, Users, Zap, Search, X, Sun, Moon, Globe } from "lucide-react"
import { useKanbanStore } from "@/lib/store"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { MembersModal } from "./members-modal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function BoardHeader() {
    const { searchQuery, setSearchQuery, boards, activeBoardId, language, setLanguage } = useKanbanStore()
    const { theme, setTheme } = useTheme()
    const { t } = useTranslation()
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)

    const activeBoard = useMemo(() => {
        return boards.find(b => b.id === activeBoardId) || null
    }, [boards, activeBoardId])

    if (!activeBoard) return null

    return (
        <header className="flex items-center justify-between px-6 h-14 border-b border-border bg-background/80 backdrop-blur-sm shrink-0 z-10">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-base font-semibold text-foreground tracking-tight">
                        {activeBoard.name}
                    </h1>
                    <p className="text-xs text-muted-foreground lowercase">
                        {activeBoard.type === 'shared' ? t('members.shared') : t('members.personal')} {t('header.workspace')}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Search */}
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

                {/* Filter button */}
                <button type="button" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-transparent hover:border-border">
                    <Filter className="w-3.5 h-3.5" />
                    <span className="text-xs">{t('header.filter')}</span>
                </button>

                {/* Members button & Avatars */}
                {activeBoard.type === 'shared' && (
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
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">{t('header.automate')}</span>
                </button>

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
                    <DropdownMenuContent align="end" className="bg-card/80 backdrop-blur-xl border-white/10 rounded-2xl min-w-[120px]">
                        <DropdownMenuItem
                            onClick={() => setLanguage('es')}
                            className={cn(
                                "gap-2 focus:bg-primary/20 focus:text-primary cursor-pointer rounded-xl font-medium",
                                language === 'es' && "text-primary bg-primary/10"
                            )}
                        >
                            <span className="text-lg">🇪🇸</span> ES
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setLanguage('en')}
                            className={cn(
                                "gap-2 focus:bg-primary/20 focus:text-primary cursor-pointer rounded-xl font-medium",
                                language === 'en' && "text-primary bg-primary/10"
                            )}
                        >
                            <span className="text-lg">🇺🇸</span> EN
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
