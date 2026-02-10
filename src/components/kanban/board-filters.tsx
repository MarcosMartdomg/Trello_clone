"use client"

import { X } from "lucide-react"
import { useKanbanStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const AVAILABLE_TAGS = [
    "Research",
    "Design",
    "Backend",
    "Frontend",
    "UX",
    "Analytics",
    "Security",
    "DevOps",
    "Marketing"
]

export function TagFilters() {
    const { tagFilter, toggleTagFilter } = useKanbanStore()

    return (
        <div className="flex flex-wrap items-center gap-2 px-6 py-2 bg-background/50 backdrop-blur-sm border-b border-border shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Filter by:</span>
            {AVAILABLE_TAGS.map((tag) => {
                const isActive = tagFilter.includes(tag)
                return (
                    <button
                        key={tag}
                        onClick={() => toggleTagFilter(tag)}
                        className={cn(
                            "px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all duration-200",
                            isActive
                                ? "bg-primary/20 text-primary border-primary/30"
                                : "bg-secondary text-muted-foreground border-transparent hover:border-border hover:text-foreground"
                        )}
                    >
                        {tag}
                    </button>
                )
            })}

            {tagFilter.length > 0 && (
                <button
                    onClick={() => tagFilter.forEach(t => toggleTagFilter(t))}
                    className="px-2 py-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors ml-2 flex items-center gap-1"
                >
                    <X className="w-3 h-3" />
                    Clear
                </button>
            )}
        </div>
    )
}
