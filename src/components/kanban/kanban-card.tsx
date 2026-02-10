"use client"

import { useState } from "react"
import { CheckSquare, GripVertical, MoreHorizontal } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { KanbanCard as KanbanCardType } from "@/lib/kanban-data"
import { CardDetailsModal } from "./card-details-modal"

const priorityDot: Record<string, string> = {
  low: "bg-blue-400",
  medium: "bg-amber-400",
  high: "bg-orange-500",
  urgent: "bg-red-500",
}

interface KanbanCardProps {
  card: KanbanCardType
  columnTitle: string
}

export function KanbanCard({ card, columnTitle }: KanbanCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "Card",
      card,
    },
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5 h-[120px] opacity-30"
      />
    )
  }

  const checklistStats = card.checklist ? {
    done: card.checklist.filter(i => i.completed).length,
    total: card.checklist.length
  } : { done: 0, total: 0 };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative rounded-xl border border-border bg-card p-3.5 cursor-grab active:cursor-grabbing transition-all duration-300",
          card.color && `${card.color} border-transparent shadow-sm`,
          "hover:border-primary/50 hover:bg-card/90 hover:backdrop-blur-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:shadow-primary/10",
          "hover:-translate-y-1.5 hover:scale-[1.02]",
        )}
        onDoubleClick={() => setIsModalOpen(true)}
        {...attributes}
        {...listeners}
      >

        {/* Top row: priority dot + menu */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            {card.priority && (
              <div className={cn("w-2 h-2 rounded-full shrink-0", priorityDot[card.priority] || "bg-muted")} />
            )}
            <h4 className="text-sm font-semibold text-foreground leading-snug truncate">
              {card.title}
            </h4>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsModalOpen(true)
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 shrink-0 ml-2"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {card.description}
          </p>
        )}

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {card.labels.map((label) => (
              <span
                key={label.id || label.text}
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide",
                  label.color
                )}
              >
                {label.text}
              </span>
            ))}
          </div>
        )}

        {/* Bottom row: checklist + members */}
        <div className="flex items-center justify-between mt-auto">
          {checklistStats.total > 0 ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckSquare className="w-3.5 h-3.5" />
              <span className={cn(
                "text-xs font-medium",
                checklistStats.done === checklistStats.total && "text-emerald-400"
              )}>
                {checklistStats.done}/{checklistStats.total}
              </span>
            </div>
          ) : (
            <div /> // Spacer
          )}

          {/* Member avatars */}
          {card.members && card.members.length > 0 && (
            <div className="flex -space-x-1.5">
              {card.members.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  title={member.name}
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-semibold ring-2 ring-card",
                    member.color,
                    "text-foreground"
                  )}
                >
                  {member.avatar}
                </div>
              ))}
              {card.members.length > 3 && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-[9px] font-medium text-muted-foreground ring-2 ring-card">
                  +{card.members.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CardDetailsModal
        card={card}
        columnTitle={columnTitle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
