
"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Trash2,
    Calendar,
    User,
    Tag,
    CheckSquare,
    AlignLeft,
    Activity,
    MoreHorizontal
} from "lucide-react"
import type { KanbanCard } from "@/lib/kanban-data"
import { useKanbanStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ConfirmDeleteModal } from "./confirm-delete-modal"
import { useTranslation } from "@/hooks/use-translation"

interface CardDetailsModalProps {
    card: KanbanCard
    columnTitle: string
    isOpen: boolean
    onClose: () => void
}

export function CardDetailsModal({ card, columnTitle, isOpen, onClose }: CardDetailsModalProps) {
    const { updateCard, deleteCard } = useKanbanStore()
    const [title, setTitle] = useState(card.title)
    const [description, setDescription] = useState(card.description)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const { t } = useTranslation()
    // Logic to handle internal state updates when card prop changes
    useEffect(() => {
        if (isOpen) {
            setTitle(card.title)
            setDescription(card.description)
        }
    }, [isOpen, card])

    const [newChecklistItem, setNewChecklistItem] = useState("")

    const handleSave = () => {
        updateCard(card.id, { title, description })
        onClose()
    }

    const handleDelete = () => {
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = () => {
        deleteCard(card.id)
        setIsDeleteModalOpen(false)
        onClose()
    }

    const addChecklistItem = () => {
        if (!newChecklistItem.trim()) return
        const newItem = {
            id: `item-${Date.now()}`,
            text: newChecklistItem,
            completed: false
        }
        updateCard(card.id, {
            checklist: [...(card.checklist || []), newItem]
        })
        setNewChecklistItem("")
    }

    const toggleChecklistItem = (itemId: string) => {
        const newChecklist = card.checklist.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        )
        updateCard(card.id, { checklist: newChecklist })
    }

    const removeChecklistItem = (itemId: string) => {
        const newChecklist = card.checklist.filter(item => item.id !== itemId)
        updateCard(card.id, { checklist: newChecklist })
    }

    const setCardColor = (color: string) => {
        updateCard(card.id, { color })
    }

    const activeBoard = useKanbanStore(state => state.boards.find(b => b.id === state.activeBoardId))
    const priorities = activeBoard?.priorities || []

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[750px] gap-0 p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Cover/Header Area */}
                <div className={cn(
                    "h-40 relative transition-colors duration-500",
                    card.color || "bg-gradient-to-br from-primary/20 via-primary/5 to-transparent"
                )}>
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/40 backdrop-blur-xl border border-white/10 transition-all rounded-full shadow-lg"
                            onClick={onClose}
                        >
                            <XIcon className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-10 p-10">

                    {/* Main Content */}
                    <div className="space-y-8">

                        {/* Title Section */}
                        <div className="space-y-3">
                            <DialogTitle asChild>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-3xl font-extrabold bg-transparent border-0 px-0 h-auto focus-visible:ring-0 focus-visible:bg-accent/10 rounded-xl transition-all"
                                />
                            </DialogTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground/80 font-medium">
                                {t('board.inList')} <span className="text-primary font-bold px-2 py-0.5 bg-primary/10 rounded-md ring-1 ring-primary/20">{columnTitle}</span>
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 text-sm font-bold text-foreground/90 uppercase tracking-wider">
                                <Tag className="w-4 h-4 text-primary" />
                                <h3>{t('board.cardColor')}</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['', 'bg-red-500/30', 'bg-orange-500/30', 'bg-amber-500/30', 'bg-emerald-500/30', 'bg-blue-500/30', 'bg-violet-500/30', 'bg-pink-500/30'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setCardColor(color)}
                                        className={cn(
                                            "w-9 h-9 rounded-xl border-2 border-transparent transition-all hover:scale-110 hover:rotate-3 shadow-sm",
                                            color || "bg-secondary",
                                            card.color === color ? "ring-2 ring-primary ring-offset-4 ring-offset-background border-primary" : "hover:border-primary/30"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5 text-sm font-bold text-foreground/90 uppercase tracking-wider">
                                <AlignLeft className="w-4 h-4 text-primary" />
                                <h3>{t('board.description')}</h3>
                            </div>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('board.descriptionPlaceholder')}
                                className="min-h-[140px] bg-secondary/20 border-border/50 resize-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-2xl p-5 text-sm leading-relaxed transition-all"
                            />
                        </div>

                        {/* Checklist */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 text-sm font-bold text-foreground/90 uppercase tracking-wider">
                                    <CheckSquare className="w-4 h-4 text-primary" />
                                    <h3>{t('board.checklist')}</h3>
                                </div>
                                {card.checklist?.length > 0 && (
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full ring-1 ring-primary/20">
                                        {t('board.progressText', { percent: Math.round((card.checklist.filter(i => i.completed).length / card.checklist.length) * 100).toString() })}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 bg-secondary/10 p-4 rounded-2xl border border-border/30">
                                {card.checklist?.map(item => (
                                    <div key={item.id} className="flex items-center gap-3.5 group animate-in fade-in slide-in-from-left-2 duration-300">
                                        <input
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={() => toggleChecklistItem(item.id)}
                                            className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary/40 cursor-pointer transition-all"
                                        />
                                        <span className={cn(
                                            "text-sm flex-1 font-medium transition-all",
                                            item.completed ? "text-muted-foreground/60 line-through" : "text-foreground/90"
                                        )}>
                                            {item.text}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => removeChecklistItem(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex gap-3 mt-4">
                                    <Input
                                        value={newChecklistItem}
                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                        placeholder={t('board.addItem')}
                                        className="h-10 text-sm bg-background/50 border-border/40 focus-visible:ring-primary/20 rounded-xl"
                                        onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                                    />
                                    <Button size="sm" onClick={addChecklistItem} className="h-10 px-5 rounded-xl font-bold shadow-md hover:shadow-primary/20 transition-all">
                                        {t('board.add')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Activity */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2.5 text-sm font-bold text-foreground/90 uppercase tracking-wider">
                                <Activity className="w-4 h-4 text-primary" />
                                <h3>{t('board.activity')}</h3>
                            </div>
                            <div className="space-y-5 pl-1">
                                {card.activity?.map(log => (
                                    <div key={log.id} className="flex gap-4 group">
                                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-[11px] font-black text-primary shrink-0 border border-primary/20 shadow-sm group-hover:scale-110 transition-all">
                                            SY
                                        </div>
                                        <div className="space-y-1.5 pt-0.5">
                                            <p className="text-sm">
                                                <span className="font-bold text-foreground/90">{t('board.system')}</span> <span className="text-muted-foreground">{t(log.text, log.params)}</span>
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/60 font-medium">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!card.activity || card.activity.length === 0) && (
                                    <p className="text-sm text-muted-foreground italic pl-2 border-l-2 border-muted py-1">{t('board.noActivity')}</p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-8">

                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.2em] ml-1">{t('board.addToCard')}</h4>
                            <div className="grid grid-cols-1 gap-2">
                                <SidebarButton icon={User} label={t('board.members')} />
                                <SidebarButton icon={Tag} label={t('board.labels')} />
                                <SidebarButton icon={CheckSquare} label={t('board.checklist')} />
                                <SidebarButton icon={Calendar} label={t('board.dates')} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.2em] ml-1">{t('board.actions')}</h4>
                            <div className="space-y-2 bg-secondary/10 p-3 rounded-2xl border border-border/30">
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">{t('board.priority')}</p>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {priorities.map(p => (
                                        <Button
                                            key={p.id}
                                            variant={card.priority === p.id ? "secondary" : "ghost"}
                                            className={cn(
                                                "w-full justify-start gap-2.5 h-9 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all",
                                                card.priority === p.id
                                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                                    : "hover:bg-primary/10 hover:text-primary"
                                            )}
                                            onClick={() => updateCard(card.id, { priority: p.id })}
                                        >
                                            <div className={cn("w-2 h-2 rounded-full", p.color, "ring-1 ring-white/20")} />
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full justify-start gap-2.5 h-11 text-[11px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 mt-6 rounded-xl shadow-sm transition-all"
                                onClick={handleDelete}
                            >
                                <Trash2 className="w-4 h-4" />
                                {t('board.deleteCard')}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-10 py-6 bg-secondary/30 border-t border-border/50 backdrop-blur-md gap-3">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 font-bold text-muted-foreground hover:bg-background">{t('common.cancel')}</Button>
                    <Button onClick={handleSave} className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">{t('board.saveChanges')}</Button>
                </DialogFooter>

            </DialogContent>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('board.deleteCard')}
                description={t('board.deleteCardConfirm', { name: card.title })}
            />
        </Dialog>
    )
}

function SidebarButton({ icon: Icon, label }: { icon: any, label: string }) {
    return (
        <Button variant="secondary" className="w-full justify-start gap-3 h-10 text-[11px] font-bold uppercase tracking-wider bg-secondary/40 hover:bg-primary hover:text-primary-foreground rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm">
            <Icon className="w-4 h-4" />
            {label}
        </Button>
    )
}

function XIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}

const priorityColorMap: Record<string, string> = {
    low: "bg-blue-400",
    medium: "bg-amber-400",
    high: "bg-orange-500",
    urgent: "bg-red-500",
}
