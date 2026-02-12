
"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  MoreHorizontal,
  Plus,
  Inbox,
  Circle,
  Loader,
  Eye,
  CheckCircle,
  Star,
  Heart,
  Zap,
  Flag,
  Tag,
  Bookmark,
  Briefcase,
  Calendar,
  Camera,
  Cloud,
  Code,
  Coffee,
  Database,
  File,
  Gift,
  Home,
  Image,
  Link,
  Lock,
  Mail,
  Map,
  Music,
  Phone,
  Search,
  Settings,
  ShoppingBag,
  Smile,
  Trophy,
  User,
  Video
} from "lucide-react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { cn } from "@/lib/utils"
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from "@/lib/kanban-data"
import { KanbanCard } from "./kanban-card"
import { useKanbanStore } from "@/lib/store"
import { ConfirmDeleteModal } from "./confirm-delete-modal"
import { useTranslation } from "@/hooks/use-translation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const iconMap: Record<string, React.ElementType> = {
  inbox: Inbox,
  circle: Circle,
  loader: Loader,
  eye: Eye,
  "check-circle": CheckCircle,
  star: Star,
  heart: Heart,
  zap: Zap,
  flag: Flag,
  tag: Tag,
  bookmark: Bookmark,
  briefcase: Briefcase,
  calendar: Calendar,
  camera: Camera,
  cloud: Cloud,
  code: Code,
  coffee: Coffee,
  database: Database,
  file: File,
  gift: Gift,
  home: Home,
  image: Image,
  link: Link,
  lock: Lock,
  mail: Mail,
  map: Map,
  music: Music,
  phone: Phone,
  search: Search,
  settings: Settings,
  shopping: ShoppingBag,
  smile: Smile,
  trophy: Trophy,
  user: User,
  video: Video,
}

const statusColors: Record<string, string> = {
  backlog: "text-muted-foreground",
  todo: "text-blue-400",
  "in-progress": "text-amber-400",
  review: "text-violet-400",
  done: "text-emerald-400",
}

interface KanbanColumnProps {
  column: KanbanColumnType
  isOverlay?: boolean
}

export function KanbanColumnComponent({ column, isOverlay }: KanbanColumnProps) {
  const { addCard, updateColumn, deleteColumn } = useKanbanStore()
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(column.title)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)
  const { t } = useTranslation()

  const titleInputRef = useRef<HTMLInputElement>(null)

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    }
  })

  useEffect(() => {
    setTitle(column.title)
  }, [column.title])

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isEditingTitle])

  const Icon = iconMap[column.icon] || Circle

  const handleAddCard = () => {
    if (!newCardTitle.trim()) {
      setIsAddingCard(false)
      return
    }

    addCard(column.id, {
      id: `card-${Date.now()}`,
      title: newCardTitle,
      description: "",
      labels: [],
      checklist: [],
      members: [],
      priority: "low",
      activity: []
    })
    setNewCardTitle("")
    setIsAddingCard(false)
  }

  const handleTitleSubmit = () => {
    setIsEditingTitle(false)
    if (title.trim() !== column.title) {
      updateColumn(column.id, { title })
    }
  }

  const handleIconChange = (iconName: string) => {
    updateColumn(column.id, { icon: iconName })
    setIsIconPickerOpen(false)
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-[320px] shrink-0 rounded-2xl bg-column transition-all duration-200 h-fit max-h-full border border-border/50 shadow-lg shadow-black/20",
        isOverlay && "opacity-50 ring-2 ring-primary rotate-2",
        isOver && !isOverlay && "ring-2 ring-primary/40 bg-column/80"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Popover open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "p-1 rounded-md hover:bg-black/5 transition-colors shrink-0 outline-none",
                  statusColors[column.id] || "text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4 cursor-pointer" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-2 bg-card/95 backdrop-blur-xl border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden" align="start">
              <div className="grid grid-cols-6 gap-1 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                {Object.entries(iconMap).map(([name, IconComp]) => (
                  <button
                    key={name}
                    onClick={() => handleIconChange(name)}
                    className={cn(
                      "p-2 rounded-xl hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center",
                      column.icon === name ? "bg-primary/20 text-primary" : "text-muted-foreground"
                    )}
                    title={name}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit()
                if (e.key === "Escape") {
                  setIsEditingTitle(false)
                  setTitle(column.title)
                }
              }}
              className="text-sm font-semibold bg-transparent border-b border-primary outline-none min-w-0 flex-1"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-semibold text-foreground truncate cursor-pointer hover:bg-accent/50 px-1 -ml-1 rounded transition-colors"
              title="Click to edit"
            >
              {t(`board.${column.id}`) !== `board.${column.id}` ? t(`board.${column.id}`) : column.title}
            </h3>
          )}

          <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground shadow-sm">
            {column.cards.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-1"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Cards area */}
      <div className="flex-1 px-2 pb-2 pt-2 space-y-2 overflow-y-auto overflow-x-hidden min-h-[100px]">
        <SortableContext items={column.cards.map((c: KanbanCardType) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map((card: KanbanCardType) => (
            <KanbanCard key={card.id} card={card} columnTitle={column.title} />
          ))}
        </SortableContext>

        {/* Inline add card form */}
        {isAddingCard && (
          <div className="rounded-xl border border-primary/30 bg-card p-3 shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <input
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsAddingCard(false)
                  setNewCardTitle("")
                }
                if (e.key === "Enter") {
                  handleAddCard()
                }
              }}
              placeholder={t('board.taskTitle')}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
            />
            <div className="flex items-center gap-2 mt-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsAddingCard(false)
                  setNewCardTitle("")
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleAddCard}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                {t('board.addCard')}
              </button>
            </div>
          </div>
        )}

        {/* Add card button */}
        {!isAddingCard && (
          <button
            type="button"
            onClick={() => setIsAddingCard(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-all duration-200 group mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('board.addCard')}</span>
          </button>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteColumn(column.id)}
        title={t('board.deleteTitle')}
        description={t('board.deleteConfirm', { name: column.title }) + ' ' + t('board.deleteWarning')}
      />
    </div>
  )
}
