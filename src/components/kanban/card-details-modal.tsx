
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
                    "h-32 relative transition-colors duration-300",
                    card.color || "bg-gradient-to-br from-primary/10 to-transparent"
                )}>
                    <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md"
                            onClick={onClose}
                        >
                            <XIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8 p-8 -mt-12">

                    {/* Main Content */}
                    <div className="space-y-8">

                        {/* Title Section */}
                        <div className="space-y-2">
                            <DialogTitle asChild>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-2xl font-bold bg-transparent border-0 px-2 h-auto focus-visible:ring-0 focus-visible:bg-accent/20 -ml-2 rounded-lg"
                                />
                            </DialogTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                                In list <span className="font-medium text-foreground underline decoration-dotted">{columnTitle}</span>
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Tag className="w-4 h-4" />
                                <h3>Card Color</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['', 'bg-red-500/20', 'bg-orange-500/20', 'bg-amber-500/20', 'bg-emerald-500/20', 'bg-blue-500/20', 'bg-violet-500/20', 'bg-pink-500/20'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setCardColor(color)}
                                        className={cn(
                                            "w-8 h-8 rounded-full border border-border transition-all hover:scale-110",
                                            color || "bg-card",
                                            card.color === color && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <AlignLeft className="w-4 h-4" />
                                <h3>Description</h3>
                            </div>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a more detailed description..."
                                className="min-h-[120px] bg-secondary/30 border-0 resize-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl p-4"
                            />
                        </div>

                        {/* Checklist */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <CheckSquare className="w-4 h-4" />
                                    <h3>Checklist</h3>
                                </div>
                                {card.checklist?.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        {Math.round((card.checklist.filter(i => i.completed).length / card.checklist.length) * 100)}% complete
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                {card.checklist?.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 group">
                                        <input
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={() => toggleChecklistItem(item.id)}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                        />
                                        <span className={cn(
                                            "text-sm flex-1 transition-all",
                                            item.completed && "text-muted-foreground line-through"
                                        )}>
                                            {item.text}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeChecklistItem(item.id)}
                                        >
                                            <Trash2 className="w-3 h-3 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        value={newChecklistItem}
                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                        placeholder="Add an item"
                                        className="h-8 text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                                    />
                                    <Button size="sm" onClick={addChecklistItem} className="h-8">Add</Button>
                                </div>
                            </div>
                        </div>

                        {/* Activity */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Activity className="w-4 h-4" />
                                <h3>Activity</h3>
                            </div>
                            <div className="space-y-4">
                                {card.activity?.map(log => (
                                    <div key={log.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 border border-primary/20">
                                            SY
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm">
                                                <span className="font-semibold text-foreground">System</span> {log.text}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!card.activity || card.activity.length === 0) && (
                                    <p className="text-sm text-muted-foreground italic">No activity yet.</p>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Add to card</h4>
                            <SidebarButton icon={User} label="Members" />
                            <SidebarButton icon={Tag} label="Labels" />
                            <SidebarButton icon={CheckSquare} label="Checklist" />
                            <SidebarButton icon={Calendar} label="Dates" />
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Actions</h4>

                            <div className="space-y-1">
                                <p className="text-[10px] font-medium text-muted-foreground ml-1 mb-1">Priority</p>
                                <div className="grid grid-cols-1 gap-1">
                                    {priorities.map(p => (
                                        <Button
                                            key={p.id}
                                            variant={card.priority === p.id ? "secondary" : "ghost"}
                                            className={cn(
                                                "w-full justify-start gap-2 h-8 text-xs font-normal",
                                                card.priority === p.id && "bg-secondary"
                                            )}
                                            onClick={() => updateCard(card.id, { priority: p.id })}
                                        >
                                            <div className={cn("w-2 h-2 rounded-full", p.color)} />
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full justify-start gap-2 h-9 text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 mt-4"
                                onClick={handleDelete}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Card
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-secondary/20 border-t border-border/50">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>

            </DialogContent>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Card"
                description={`Are you sure you want to delete the card "${card.title}"? This action cannot be undone.`}
            />
        </Dialog>
    )
}

function SidebarButton({ icon: Icon, label }: { icon: any, label: string }) {
    return (
        <Button variant="secondary" className="w-full justify-start gap-2 h-8 text-sm font-normal bg-secondary/50 hover:bg-secondary">
            <Icon className="w-3.5 h-3.5" />
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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 18 18" />
        </svg>
    )
}

const priorityColorMap: Record<string, string> = {
    low: "bg-blue-400",
    medium: "bg-amber-400",
    high: "bg-orange-500",
    urgent: "bg-red-500",
}
