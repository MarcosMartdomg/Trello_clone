"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CheckSquare, GripVertical, MoreHorizontal, Clock } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { KanbanCard as KanbanCardType } from "@/lib/kanban-data"
import { CardDetailsModal } from "./card-details-modal"
import { useTranslation } from "@/hooks/use-translation"

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
  const { t } = useTranslation()

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

  const checklistStats = Array.isArray(card.checklist) ? {
    done: card.checklist.filter(i => i.completed).length,
    total: card.checklist.length
  } : { done: 0, total: 0 };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative rounded-xl border border-border bg-card p-4 cursor-grab active:cursor-grabbing transition-all duration-300 ease-in-out",
          card.color && `${card.color} border-transparent shadow-sm`,
          "hover:border-primary/20 hover:bg-card/98 hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)]",
          "hover:-translate-y-1 hover:scale-[1.005] ring-offset-background hover:ring-2 hover:ring-primary/5",
        )}
        onDoubleClick={() => setIsModalOpen(true)}
        {...attributes}
        {...listeners}
      >

        {/* Top row: priority dot + menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <h4 className="text-sm font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
              {card.title}
            </h4>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsModalOpen(true)
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 shrink-0 ml-2 shadow-sm"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-2 mb-4">
            {card.description}
          </p>
        )}

        {/* Labels */}
        {Array.isArray(card.labels) && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {card.labels.map((label) => (
              <span
                key={label.id || label.text}
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm",
                  label.color
                )}
              >
                {t(`tags.${label.text}`) !== `tags.${label.text}` ? t(`tags.${label.text}`) : label.text}
              </span>
            ))}
          </div>
        )}

        {/* Bottom row: checklist + members */}
        <div className="flex items-center justify-between mt-auto pt-2 gap-3">
          <div className="flex items-center gap-3">
            {/* Due Date */}
            {card.due_date && (
              <div className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors",
                checklistStats.done === checklistStats.total && checklistStats.total > 0
                  ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
                  : new Date(card.due_date) < new Date()
                    ? "bg-red-500/10 text-red-500 ring-1 ring-red-500/20"
                    : "bg-secondary/50 text-muted-foreground ring-1 ring-border/50"
              )}>
                <Clock className="w-3 h-3" />
                <span>{format(new Date(card.due_date), "MMM d")}</span>
              </div>
            )}

            {/* Checklist */}
            {checklistStats.total > 0 && (
              <div className="flex flex-col gap-1 w-[100px]">
                <div className="flex items-center justify-between text-[9px] font-black text-muted-foreground/70 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" />
                    <span>{Math.round((checklistStats.done / checklistStats.total) * 100)}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 ease-out",
                      checklistStats.done === checklistStats.total
                        ? "bg-emerald-500"
                        : "bg-primary"
                    )}
                    style={{ width: `${(checklistStats.done / checklistStats.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Member avatars */}
          {card.members && card.members.length > 0 && (
            <div className="flex -space-x-2 ml-4">
              {card.members.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  title={member.name}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-[9px] font-black ring-2 ring-card group-hover:ring-primary/20",
                    member.color,
                    "text-foreground shadow-sm transition-transform hover:-translate-y-1 hover:z-10"
                  )}
                >
                  {member.avatar}
                </div>
              ))}
              {card.members.length > 3 && (
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary/80 text-[8px] font-black text-muted-foreground ring-2 ring-card shadow-sm">
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
