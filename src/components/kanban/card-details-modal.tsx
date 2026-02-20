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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslation } from "@/hooks/use-translation"

interface CardDetailsModalProps {
    card: KanbanCard
    columnTitle: string
    isOpen: boolean
    onClose: () => void
    isReadOnly?: boolean;
}

export function CardDetailsModal({ card, columnTitle, isOpen, onClose, isReadOnly = false }: CardDetailsModalProps) {
    const { updateCard, deleteCard, addCardMember, removeCardMember, boards, activeBoardId } = useKanbanStore()
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

    // Members state
    const [isOpenMembersPopover, setIsOpenMembersPopover] = useState(false)

    // Checklist state
    const [newChecklistItem, setNewChecklistItem] = useState("")
    const [showChecklist, setShowChecklist] = useState(false)

    // Labels state
    const [newLabelName, setNewLabelName] = useState("")
    const [selectedLabelColor, setSelectedLabelColor] = useState("bg-primary")
    const [isOpenLabelPopover, setIsOpenLabelPopover] = useState(false)

    const activeBoard = boards.find(b => b.id === activeBoardId)
    const boardMembers = activeBoard?.members || []

    // Sync state with props
    useEffect(() => {
        if (isOpen) {
            setTitle(card.title)
            setDescription(card.description)
            setDate(card.due_date ? new Date(card.due_date) : undefined)
            setShowChecklist(Array.isArray(card.checklist) && card.checklist.length > 0)
        }
    }, [isOpen, card])

    // ... (rest of effects)

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

    const toggleChecklistItem = (itemId: string) => {
        const newChecklist = card.checklist.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        )
        updateCard(card.id, { checklist: newChecklist })
    }

    const addChecklistItem = () => {
        if (!newChecklistItem.trim()) return
        const newItem = {
            id: Math.random().toString(36).substring(7),
            text: newChecklistItem,
            completed: false
        }
        updateCard(card.id, { checklist: [...(card.checklist || []), newItem] })
        setNewChecklistItem("")
    }

    const deleteChecklistItem = (itemId: string) => {
        const newChecklist = card.checklist.filter(item => item.id !== itemId)
        updateCard(card.id, { checklist: newChecklist })
    }

    // Color logic
    const colors = [
        { name: 'None', class: 'bg-gradient-to-br from-primary/20 via-primary/5 to-transparent' },
        { name: 'Red', class: 'bg-red-500/40' },
        { name: 'Orange', class: 'bg-orange-500/40' },
        { name: 'Amber', class: 'bg-amber-500/40' },
        { name: 'Emerald', class: 'bg-emerald-500/40' },
        { name: 'Blue', class: 'bg-blue-500/40' },
        { name: 'Violet', class: 'bg-violet-500/40' },
        { name: 'Purple', class: 'bg-purple-500/40' },
        { name: 'Pink', class: 'bg-pink-500/40' },
        { name: 'Slate', class: 'bg-slate-500/40' },
    ]

    const updateCardColor = (colorClass: string) => {
        updateCard(card.id, { color: colorClass })
    }
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


    const toggleMember = (memberId: string) => {
        const isAssigned = card.members?.some(m => m.id === memberId)
        if (isAssigned) {
            removeCardMember(card.id, memberId)
        } else {
            addCardMember(card.id, memberId)
        }
    }

    const handleCreateLabel = () => {
        if (!newLabelName.trim()) return;

        const color = selectedLabelColor;
        const colorClass = `${color}/20 ${color.replace('bg-', 'text-')} ring-1 ${color.replace('bg-', 'ring-')}/30`;
        const newLabels = [...(card.labels || []), {
            id: `custom-${Date.now()}`,
            text: newLabelName.trim(),
            color: colorClass
        }];

        updateCard(card.id, { labels: newLabels });
        setNewLabelName("");
        setSelectedLabelColor("bg-primary");
        setIsOpenLabelPopover(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[750px] gap-0 p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Cover/Header Area */}
                <div className={cn(
                    "h-40 relative transition-colors duration-500",
                    card.color || "bg-gradient-to-br from-primary/20 via-primary/5 to-transparent"
                )}>
                    {/* ... (keep existing header) */}
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

                {isReadOnly && (
                    <div className="bg-primary/5 border-y border-primary/10 px-10 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-black text-primary uppercase tracking-wider leading-none mb-1">
                                {t('board.visionMode')}
                            </h4>
                            <p className="text-xs text-muted-foreground font-medium">
                                {t('board.visionModeDesc')}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-10 p-10">

                    {/* Main Content */}
                    <div className="space-y-8">

                        {/* Title Section */}
                        <div className="space-y-3">
                            <DialogTitle asChild>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    readOnly={isReadOnly}
                                    className={cn(
                                        "text-3xl font-extrabold bg-transparent border-0 px-0 h-auto focus-visible:ring-0 focus-visible:bg-accent/10 rounded-xl transition-all",
                                        isReadOnly && "pointer-events-none select-none"
                                    )}
                                />
                            </DialogTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground/80 font-medium">
                                {t('board.inList')} <span className="text-primary font-bold px-2 py-0.5 bg-primary/10 rounded-md ring-1 ring-primary/20">{columnTitle}</span>
                            </div>
                        </div>

                        {/* MEMBERS DISPLAY & DATE DISPLAY ROW */}
                        <div className="flex flex-wrap gap-6">
                            {/* Assigned Members */}
                            {card.members && card.members.length > 0 && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <h3 className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">{t('board.members')}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {card.members.map(member => (
                                            <div key={member.id} className="group relative">
                                                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                                                    <AvatarFallback className="text-[10px] font-black bg-primary/20 text-primary">
                                                        {member.name?.[0]?.toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-md pointer-events-none z-50">
                                                    {member.name}
                                                </div>
                                            </div>
                                        ))}
                                        {!isReadOnly && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground"
                                                onClick={() => setIsOpenMembersPopover(true)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Due Date Display */}
                            {date && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <h3 className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">{t('board.dueDate')}</h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "h-9 justify-start text-left font-normal transition-all",
                                                card.checklist && card.checklist.length > 0 && card.checklist.every(i => i.completed)
                                                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                                                    : "bg-secondary/20 hover:bg-secondary/40 border-transparent hover:border-primary/20"
                                            )}
                                            onClick={() => setIsOpenDatePopover(true)}
                                        >
                                            <CalendarIcon className={cn(
                                                "mr-2 h-4 w-4",
                                                card.checklist && card.checklist.length > 0 && card.checklist.every(i => i.completed)
                                                    ? "text-emerald-500"
                                                    : "text-primary"
                                            )} />
                                            {format(date, "PPP")} at {format(date, "p")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">{t('board.cardColor')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {colors.map((c) => (
                                    <button
                                        key={c.name}
                                        onClick={() => !isReadOnly && updateCardColor(c.class)}
                                        disabled={isReadOnly}
                                        className={cn(
                                            "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
                                            c.class,
                                            card.color === c.class ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-transparent",
                                            isReadOnly && "cursor-default hover:scale-100 opacity-80"
                                        )}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <AlignLeft className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-bold tracking-tight">{t('board.description')}</h3>
                            </div>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                readOnly={isReadOnly}
                                placeholder={t('board.descriptionPlaceholder')}
                                className={cn(
                                    "min-h-[120px] bg-secondary/20 border-border/40 focus-visible:ring-primary/20 rounded-2xl p-4 text-sm leading-relaxed resize-none transition-all focus:bg-secondary/30",
                                    isReadOnly && "pointer-events-none select-none opacity-80"
                                )}
                            />
                        </div>

                        {/* Checklist */}
                        {showChecklist && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CheckSquare className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-bold tracking-tight">{t('board.checklist')}</h3>
                                    </div>
                                    {!isReadOnly && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs font-bold hover:bg-destructive/10 hover:text-destructive rounded-lg"
                                            onClick={() => {
                                                updateCard(card.id, { checklist: [] })
                                                setShowChecklist(false)
                                            }}
                                        >
                                            {t('common.delete')}
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-1.5 ml-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <span className="text-[10px] font-black text-muted-foreground w-8">
                                            {Math.round((card.checklist?.filter(i => i.completed).length / (card.checklist?.length || 1)) * 100 || 0)}%
                                        </span>
                                        <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                                style={{ width: `${(card.checklist?.filter(i => i.completed).length / (card.checklist?.length || 1)) * 100 || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        {card.checklist?.map((item) => (
                                            <div key={item.id} className="group flex items-center gap-3 p-2 hover:bg-secondary/30 rounded-xl transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={item.completed}
                                                    onChange={() => !isReadOnly && toggleChecklistItem(item.id)}
                                                    disabled={isReadOnly}
                                                    className={cn(
                                                        "w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary",
                                                        isReadOnly && "cursor-default opacity-50"
                                                    )}
                                                />
                                                <span className={cn(
                                                    "text-sm font-medium flex-1 transition-all",
                                                    item.completed ? "text-muted-foreground line-through opacity-70" : "text-foreground"
                                                )}>
                                                    {item.text}
                                                </span>
                                                {!isReadOnly && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive rounded-lg"
                                                        onClick={() => deleteChecklistItem(item.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}

                                        {!isReadOnly && (
                                            <div className="pt-2 flex gap-2">
                                                <Input
                                                    value={newChecklistItem}
                                                    onChange={(e) => setNewChecklistItem(e.target.value)}
                                                    placeholder={t('board.addItem')}
                                                    onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                                                    className="h-9 text-xs bg-secondary/10 border-border/30 focus-visible:ring-primary/20 rounded-xl px-4"
                                                />
                                                <Button
                                                    onClick={addChecklistItem}
                                                    size="sm"
                                                    className="h-9 px-4 rounded-xl font-bold text-xs"
                                                >
                                                    {t('board.add')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Activity */}
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-bold tracking-tight">{t('board.activity')}</h3>
                            </div>

                            <div className="space-y-6 ml-1 min-h-[100px]">
                                {card.activity && card.activity.length > 0 ? (
                                    card.activity.map((item) => (
                                        <div key={item.id} className="flex gap-4 group">
                                            <Avatar className="h-8 w-8 ring-2 ring-background border-2 border-primary/20">
                                                <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                                                    {item.user?.name?.[0] || 'S'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {item.user?.name || t('board.system')}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-medium bg-secondary/30 px-2 py-0.5 rounded-full">
                                                        {format(new Date(item.timestamp), "MMM d, HH:mm")}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground/90 leading-relaxed">
                                                    {item.type === 'move'
                                                        ? t('board.movedCard', { from: item.params?.from || '', to: item.params?.to || '' })
                                                        : item.type === 'create'
                                                            ? t('board.createdCard')
                                                            : item.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 opacity-50">
                                        <Activity className="w-8 h-8 text-muted-foreground/30" />
                                        <p className="text-xs font-medium text-muted-foreground">{t('board.noActivity')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-8">

                        {!isReadOnly && (
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-[0.2em] ml-1">{t('board.addToCard')}</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {/* MEMBERS POPOVER - only for shared boards */}
                                    {activeBoard?.type !== 'personal' && (
                                        <Popover open={isOpenMembersPopover} onOpenChange={setIsOpenMembersPopover}>
                                            <PopoverTrigger asChild>
                                                <Button variant="secondary" className="w-full justify-start gap-3 h-10 text-[11px] font-bold uppercase tracking-wider bg-secondary/40 hover:bg-primary hover:text-primary-foreground rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm">
                                                    <User className="w-4 h-4" />
                                                    {t('board.members')}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[280px] p-0 shadow-2xl rounded-2xl border-border/40 bg-card overflow-hidden" align="start" sideOffset={8}>
                                                <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/20">
                                                    <span className="text-xs font-bold text-foreground mx-auto">{t('board.members')}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-full absolute right-2 hover:bg-secondary/60"
                                                        onClick={() => setIsOpenMembersPopover(false)}
                                                    >
                                                        <XIcon className="w-3 h-3 opacity-60" />
                                                    </Button>
                                                </div>

                                                <div className="p-2 space-y-1">
                                                    <Input
                                                        placeholder={t('members.searchPlaceholder')}
                                                        className="h-8 text-xs bg-secondary/20 border-border/40 rounded-lg mb-2"
                                                    />
                                                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">{t('board.boardMembers')}</p>
                                                        {boardMembers.length === 0 && (
                                                            <p className="text-xs text-muted-foreground italic px-2 py-2">{t('members.noMembers')}</p>
                                                        )}
                                                        {boardMembers.map(member => {
                                                            const isSelected = card.members?.some(m => m.id === member.id)
                                                            return (
                                                                <button
                                                                    key={member.id}
                                                                    onClick={() => toggleMember(member.id)}
                                                                    className="flex items-center gap-3 w-full p-2 hover:bg-secondary/40 rounded-lg transition-colors group"
                                                                >
                                                                    <Avatar className="h-7 w-7">
                                                                        <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">{member.name?.[0]}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-xs font-medium text-foreground flex-1 text-left truncate">{member.name}</span>
                                                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}

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
                        )}

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
                                                    onClick={() => !isReadOnly && (
                                                        updateCard(card.id, { labels: card.labels.filter(l => (l.id || l.text) !== (label.id || label.text)) })
                                                    )}
                                                    disabled={isReadOnly}
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 active:scale-95 group",
                                                        label.color,
                                                        isReadOnly && "cursor-default hover:scale-100"
                                                    )}
                                                >
                                                    {t(`tags.${label.text}`) !== `tags.${label.text}` ? t(`tags.${label.text}`) : label.text}
                                                    {!isReadOnly && <XIcon className="w-2 h-2 opacity-50 group-hover:opacity-100" />}
                                                </button>
                                            ))
                                        ) : (
                                            <span className="text-[9px] text-muted-foreground/50 italic ml-1">{t('board.noLabels')}</span>
                                        )}
                                    </div>

                                    {!isReadOnly && <div className="h-[1px] bg-border/30 mx-1" />}

                                    {/* Predefined & Quick Add */}
                                    {!isReadOnly && (
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
                                                            const priorityPresets = ['low', 'medium', 'high', 'urgent'];
                                                            // Filter out any existing priority labels to only have one
                                                            const otherLabels = (card.labels || []).filter(l => !priorityPresets.includes(l.text));
                                                            const newLabels = [...otherLabels, { id: preset.id, text: preset.text, color: preset.color }];

                                                            updateCard(card.id, {
                                                                labels: newLabels,
                                                                priority: preset.text // Synchronize priority property
                                                            });
                                                        }}
                                                    >
                                                        <div className={cn("w-2 h-2 rounded-full", preset.color.split(' ')[0])} />
                                                        {t(`tags.${preset.text}`)}
                                                    </Button>
                                                );
                                            })}

                                            {/* Custom Label Creator (Minimal) */}
                                            <Popover open={isOpenLabelPopover} onOpenChange={setIsOpenLabelPopover}>
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
                                                            value={newLabelName}
                                                            onChange={(e) => setNewLabelName(e.target.value)}
                                                            placeholder="..."
                                                            className="h-9 text-xs bg-secondary/20 border-border/40 focus-visible:ring-primary/20 rounded-xl"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && newLabelName.trim()) {
                                                                    handleCreateLabel();
                                                                }
                                                            }}
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
                                                                    type="button"
                                                                    className={cn(
                                                                        "w-full aspect-square rounded-lg transition-all hover:scale-110 border-2",
                                                                        color,
                                                                        selectedLabelColor === color ? "border-white shadow-lg scale-110" : "border-transparent"
                                                                    )}
                                                                    onClick={() => setSelectedLabelColor(color)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        className="w-full h-9 rounded-xl font-bold text-xs mt-2"
                                                        disabled={!newLabelName.trim()}
                                                        onClick={handleCreateLabel}
                                                    >
                                                        {t('common.create')}
                                                    </Button>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isReadOnly && (
                                <Button
                                    variant="destructive"
                                    className="w-full justify-start gap-2.5 h-11 text-[11px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 mt-6 rounded-xl shadow-sm transition-all"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t('board.deleteCard')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-10 py-6 bg-secondary/30 border-t border-border/50 backdrop-blur-md gap-3">
                    {isReadOnly ? (
                        <Button onClick={onClose} className="rounded-xl px-12 font-bold shadow-lg bg-primary hover:scale-[1.02] active:scale-95 transition-all mx-auto">
                            {t('common.ready')}
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 font-bold text-muted-foreground hover:bg-background">{t('common.cancel')}</Button>
                            <Button onClick={handleSave} className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">{t('board.saveChanges')}</Button>
                        </>
                    )}
                </DialogFooter>

            </DialogContent>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t('board.deleteCard')}
                description={t('board.deleteCardConfirm', { name: card.title })}
            />
        </Dialog >
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
