"use client"

import { useMemo } from "react"
import { Filter, Users, Zap, Search, X } from "lucide-react"
import { useKanbanStore } from "@/lib/store"

export function BoardHeader() {
    const { searchQuery, setSearchQuery, boards, activeBoardId } = useKanbanStore()

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
                    <p className="text-xs text-muted-foreground">Personal Workspace</p>
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
                        placeholder="Search tasks..."
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
                    <span className="text-xs">Filter</span>
                </button>

                {/* Group */}
                <button type="button" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-transparent hover:border-border">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs">Members</span>
                </button>

                {/* Automations */}
                <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Automate</span>
                </button>
            </div>
        </header>
    )
}
