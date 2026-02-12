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
    Clock,
    Plus
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
                                    <PopoverContent className="w-[340px] p-0 shadow-2xl rounded-2xl border-border/40 bg-card overflow-hidden" align="start" sideOffset={8}>
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30">
                                            <div className="w-7" />
                                            <span className="text-sm font-bold text-foreground">{t('board.dates')}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-full hover:bg-secondary/60"
                                                onClick={() => setIsOpenDatePopover(false)}
                                            >
                                                <XIcon className="w-3.5 h-3.5 opacity-60" />
                                            </Button>
                                        </div>

                                        {/* Calendar */}
                                        <div className="px-2 pt-2 pb-0 flex justify-center">
                                            <Calendar
                                                mode="single"
                                                selected={tempDate}
                                                onSelect={handleDateSelect}
                                                initialFocus
                                                className="rounded-lg border-0 shadow-none"
                                            />
                                        </div>

                                        {/* Inputs Section */}
                                        <div className="px-5 pb-5 space-y-5">
                                            {/* Due Date */}
                                            <div className="space-y-2.5">
                                                <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">{t('board.dueDate')}</span>
                                                <div className="flex gap-2.5">
                                                    <div className="flex items-center h-10 px-3 rounded-lg border border-border/50 bg-background/60 flex-1 gap-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
                                                        <input
                                                            type="checkbox"
                                                            checked={dueDateChecked}
                                                            onChange={(e) => setDueDateChecked(e.target.checked)}
                                                            className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={tempDate ? format(tempDate, "dd/MM/yyyy") : ""}
                                                            readOnly
                                                            className="text-sm font-medium bg-transparent border-0 w-full focus:outline-none cursor-default text-foreground/90"
                                                            placeholder="D/M/AAAA"
                                                        />
                                                    </div>
                                                    <div className="w-[100px]">
                                                        <div className="flex items-center h-10 px-3 rounded-lg border border-border/50 bg-background/60 gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
                                                            <input
                                                                type="time"
                                                                value={tempDate ? format(tempDate, "HH:mm") : ""}
                                                                onChange={handleTimeChange}
                                                                className="text-sm font-medium bg-transparent border-0 w-full focus:outline-none text-foreground/90 [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-80"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Buttons */}
                                            <div className="grid grid-cols-1 gap-2.5 pt-1">
                                                <Button
                                                    onClick={saveDate}
                                                    className="w-full h-10 rounded-xl font-bold text-sm shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all"
                                                >
                                                    {t('board.save')}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={removeDate}
                                                    className="w-full h-10 rounded-xl font-bold text-sm bg-secondary/40 hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all"
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

                            {/* Labels Manager */}
                            <div className="space-y-3 bg-secondary/10 p-3 rounded-2xl border border-border/30">
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">{t('board.labels')}</p>

                                <div className="space-y-3">
                                    {/* Active Labels for easy removal */}
                                    <div className="flex flex-wrap gap-1.5 min-h-[20px]">
                                        {Array.isArray(card.labels) && card.labels.length > 0 ? (
                                            card.labels.map(label => (
                                                <button
                                                    key={label.id || label.text}
                                                    onClick={() => {
                                                        const newLabels = card.labels.filter(l => (l.id || l.text) !== (label.id || label.text));
                                                        updateCard(card.id, { labels: newLabels });
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 active:scale-95 group",
                                                        label.color
                                                    )}
                                                >
                                                    {t(`tags.${label.text}`) !== `tags.${label.text}` ? t(`tags.${label.text}`) : label.text}
                                                    <XIcon className="w-2 h-2 opacity-50 group-hover:opacity-100" />
                                                </button>
                                            ))
                                        ) : (
                                            <span className="text-[9px] text-muted-foreground/50 italic ml-1">{t('board.noLabels')}</span>
                                        )}
                                    </div>

                                    <div className="h-[1px] bg-border/30 mx-1" />

                                    {/* Predefined & Quick Add */}
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {[
                                            { id: 'low', text: 'low', color: 'bg-blue-500/20 text-blue-500 ring-1 ring-blue-500/30' },
                                            { id: 'medium', text: 'medium', color: 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30' },
                                            { id: 'high', text: 'high', color: 'bg-orange-500/20 text-orange-500 ring-1 ring-orange-500/30' },
                                            { id: 'urgent', text: 'urgent', color: 'bg-red-500/20 text-red-500 ring-1 ring-red-500/30' },
                                        ].map(preset => {
                                            const isActive = card.labels?.some(l => l.id === preset.id || l.text === preset.text);
                                            return (
                                                <Button
                                                    key={preset.id}
                                                    variant="ghost"
                                                    disabled={isActive}
                                                    className={cn(
                                                        "w-full justify-start gap-2.5 h-9 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-primary/10 hover:text-primary",
                                                        isActive && "opacity-50 grayscale"
                                                    )}
                                                    onClick={() => {
                                                        const newLabels = [...(card.labels || []), { id: preset.id, text: preset.text, color: preset.color }];
                                                        updateCard(card.id, { labels: newLabels });
                                                    }}
                                                >
                                                    <div className={cn("w-2 h-2 rounded-full", preset.color.split(' ')[0])} />
                                                    {t(`tags.${preset.text}`)}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    {/* Custom Label Creator (Minimal) */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full h-8 text-[9px] font-black uppercase tracking-widest border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all rounded-xl mt-2">
                                                <Plus className="w-3 h-3 mr-1.5" />
                                                {t('board.createLabel')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-4 space-y-4 bg-card/95 backdrop-blur-xl border-border/50 rounded-2xl shadow-2xl">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('board.labelName')}</label>
                                                <Input
                                                    id="new-label-name"
                                                    placeholder="..."
                                                    className="h-9 text-xs bg-secondary/20 border-border/40 focus-visible:ring-primary/20 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('board.cardColor')}</label>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {[
                                                        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
                                                        'bg-blue-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500',
                                                        'bg-slate-500', 'bg-zinc-500'
                                                    ].map(color => (
                                                        <button
                                                            key={color}
                                                            className={cn("w-full aspect-square rounded-lg transition-all hover:scale-110", color)}
                                                            onClick={() => {
                                                                const name = (document.getElementById('new-label-name') as HTMLInputElement)?.value;
                                                                if (!name) return;
                                                                const colorClass = `${color}/20 ${color.replace('bg-', 'text-')} ring-1 ${color.replace('bg-', 'ring-')}/30`;
                                                                const newLabels = [...(card.labels || []), {
                                                                    id: `custom-${Date.now()}`,
                                                                    text: name,
                                                                    color: colorClass
                                                                }];
                                                                updateCard(card.id, { labels: newLabels });
                                                                (document.getElementById('new-label-name') as HTMLInputElement).value = '';
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
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
