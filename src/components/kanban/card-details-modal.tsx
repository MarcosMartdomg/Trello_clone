"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Trash2,
    Calendar as CalendarIcon,
    User,
    Tag,
    CheckSquare,
    AlignLeft,
    Activity,
    MoreHorizontal,
    Clock
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

    // Date state
    const [date, setDate] = useState<Date | undefined>(
        card.due_date ? new Date(card.due_date) : undefined
    )
    const [isOpenDatePopover, setIsOpenDatePopover] = useState(false)
    const [tempDate, setTempDate] = useState<Date | undefined>()
    const [dueDateChecked, setDueDateChecked] = useState(false)

    // Checklist state
    const [newChecklistItem, setNewChecklistItem] = useState("")
    const [showChecklist, setShowChecklist] = useState(false)

    // Sync state with props
    useEffect(() => {
        if (isOpen) {
            setTitle(card.title)
            setDescription(card.description)
            setDate(card.due_date ? new Date(card.due_date) : undefined)
            setShowChecklist(Array.isArray(card.checklist) && card.checklist.length > 0)
        }
    }, [isOpen, card])

    // Reset temp state when popover opens
    useEffect(() => {
        if (isOpenDatePopover) {
            const currentDate = card.due_date ? new Date(card.due_date) : new Date()
            setTempDate(currentDate)
            setDueDateChecked(!!card.due_date)
        }
    }, [isOpenDatePopover, card.due_date])

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

    // Checklist Logic
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

    // Color Logic
    const setCardColor = (color: string) => {
        updateCard(card.id, { color })
    }

    // Date Logic
    const handleDateSelect = (newDate: Date | undefined) => {
        if (newDate) {
            const current = tempDate || new Date()
            newDate.setHours(current.getHours())
            newDate.setMinutes(current.getMinutes())
            setTempDate(newDate)
            setDueDateChecked(true)
        }
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!tempDate) return
        const [hours, minutes] = e.target.value.split(':').map(Number)
        const newDate = new Date(tempDate)
        newDate.setHours(hours)
        newDate.setMinutes(minutes)
        setTempDate(newDate)
        setDueDateChecked(true)
    }

    const saveDate = () => {
        if (dueDateChecked && tempDate) {
            setDate(tempDate)
            updateCard(card.id, { due_date: tempDate.toISOString() })
        } else {
            setDate(undefined)
            updateCard(card.id, { due_date: null as any })
        }
        setIsOpenDatePopover(false)
    }

    const removeDate = () => {
        setDate(undefined)
        updateCard(card.id, { due_date: null as any })
        setIsOpenDatePopover(false)
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

                        {/* Due Date Display */}
                        {date && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="flex items-center gap-2.5 text-sm font-bold text-foreground/90 uppercase tracking-wider">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <h3>{t('board.dueDate')}</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-9 justify-start text-left font-normal bg-secondary/20 hover:bg-secondary/40 border-transparent hover:border-primary/20"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                        {format(date, "PPP")} at {format(date, "p")}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDateSelect(undefined)}
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

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
                        {showChecklist && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 text-sm font-bold text-foreground/90 uppercase tracking-wider">
                                        <CheckSquare className="w-4 h-4 text-primary" />
                                        <h3>{t('board.checklist')}</h3>
                                    </div>
                                    {Array.isArray(card.checklist) && card.checklist.length > 0 && (
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full ring-1 ring-primary/20">
                                            {t('board.progressText', { percent: Math.round((card.checklist.filter(i => i.completed).length / card.checklist.length) * 100).toString() })}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-3 bg-secondary/10 p-4 rounded-2xl border border-border/30">
                                    {Array.isArray(card.checklist) && card.checklist.map(item => (
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
                        )}

                        {/* Activity */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-2.5 text-sm font-bold text-foreground/90 uppercase tracking-wider">
                                <Activity className="w-4 h-4 text-primary" />
                                <h3>{t('board.activity')}</h3>
                            </div>
                            <div className="space-y-5 pl-1">
                                {Array.isArray(card.activity) && card.activity.map(log => (
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
                                <SidebarButton icon={User} label={t('board.members')} onClick={() => { }} />
                                <SidebarButton icon={CheckSquare} label={t('board.checklist')} onClick={() => setShowChecklist(true)} />

                                <Popover open={isOpenDatePopover} onOpenChange={setIsOpenDatePopover}>
                                    <PopoverTrigger asChild>
                                        <Button variant="secondary" className="w-full justify-start gap-3 h-10 text-[11px] font-bold uppercase tracking-wider bg-secondary/40 hover:bg-primary hover:text-primary-foreground rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm">
                                            <CalendarIcon className="w-4 h-4" />
                                            {t('board.dates')}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 shadow-2xl rounded-xl border-border/60 bg-card overflow-hidden" align="start" sideOffset={8}>
                                        {/* Header */}
                                        <div className="flex items-center justify-between p-3 border-b border-border/40 bg-secondary/20">
                                            <span className="text-sm font-bold text-foreground/80 flex-1 text-center pl-7">{t('board.dates')}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full hover:bg-secondary/50"
                                                onClick={() => setIsOpenDatePopover(false)}
                                            >
                                                <XIcon className="w-3.5 h-3.5 opacity-70" />
                                            </Button>
                                        </div>

                                        {/* Calendar */}
                                        <div className="p-2 flex justify-center bg-card/50">
                                            <Calendar
                                                mode="single"
                                                selected={tempDate}
                                                onSelect={handleDateSelect}
                                                initialFocus
                                                className="rounded-lg border-0 shadow-none"
                                                classNames={{
                                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold",
                                                    day_today: "bg-accent text-accent-foreground font-bold",
                                                }}
                                            />
                                        </div>

                                        {/* Inputs Section */}
                                        <div className="p-4 pt-0 space-y-4">
                                            <div className="space-y-1.5">
                                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-0.5">
                                                    {t('board.dueDate')}
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex items-center h-9 px-2.5 rounded-lg border border-border/60 bg-background/50 flex-1 gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                                                        <input
                                                            type="checkbox"
                                                            checked={dueDateChecked}
                                                            onChange={(e) => setDueDateChecked(e.target.checked)}
                                                            className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={tempDate ? format(tempDate, "P") : ""}
                                                            readOnly
                                                            className="text-sm font-medium bg-transparent border-0 w-full focus:outline-none cursor-default text-foreground/90 pl-1"
                                                            placeholder="D/M/YYYY"
                                                        />
                                                    </div>
                                                    <div className="w-24">
                                                        <Input
                                                            type="time"
                                                            value={tempDate ? format(tempDate, "HH:mm") : ""}
                                                            onChange={handleTimeChange}
                                                            className="h-9 text-sm font-medium bg-background/50 border-border/60 focus-visible:ring-primary/20"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Buttons */}
                                            <div className="grid grid-cols-1 gap-2 pt-2">
                                                <Button
                                                    onClick={saveDate}
                                                    className="w-full h-9 rounded-lg font-bold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all"
                                                >
                                                    {t('board.save')}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={removeDate}
                                                    className="w-full h-9 rounded-lg font-bold bg-secondary/50 hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all"
                                                >
                                                    {t('board.remove')}
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
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

function SidebarButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
    return (
        <Button variant="secondary" onClick={onClick} className="w-full justify-start gap-3 h-10 text-[11px] font-bold uppercase tracking-wider bg-secondary/40 hover:bg-primary hover:text-primary-foreground rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm">
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
