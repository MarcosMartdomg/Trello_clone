"use client"

import { useState } from "react"
import { CheckSquare, GripVertical, MoreHorizontal } from "lucide-react"
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
          "group relative rounded-xl border border-border bg-card p-4 cursor-grab active:cursor-grabbing transition-all duration-300",
          card.color && `${card.color} border-transparent shadow-sm`,
          "hover:border-primary/40 hover:bg-card/95 hover:backdrop-blur-xl hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] hover:shadow-primary/20",
          "hover:-translate-y-2 hover:scale-[1.03] ring-offset-background hover:ring-2 hover:ring-primary/10",
        )}
        onDoubleClick={() => setIsModalOpen(true)}
        {...attributes}
        {...listeners}
      >

        {/* Top row: priority dot + menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {card.priority && (
              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 ring-4 ring-offset-0 transition-all group-hover:scale-110", priorityDot[card.priority] || "bg-muted", "ring-primary/5")} />
            )}
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
        {card.labels && card.labels.length > 0 && (
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
        <div className="flex items-center justify-between mt-auto pt-2">
          {checklistStats.total > 0 ? (
            <div className="flex flex-col gap-2 flex-1 max-w-[130px]">
              <div className="flex items-center justify-between text-[10px] font-black text-foreground/80 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  <span>{t('board.progress')}</span>
                </div>
                <span className="text-primary">{Math.round((checklistStats.done / checklistStats.total) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden shadow-inner ring-1 ring-border/5">
                <div
                  className={cn(
                    "h-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(59,130,246,0.3)]",
                    checklistStats.done === checklistStats.total
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                      : "bg-gradient-to-r from-primary to-blue-600"
                  )}
                  style={{ width: `${(checklistStats.done / checklistStats.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div /> // Spacer
          )}

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
