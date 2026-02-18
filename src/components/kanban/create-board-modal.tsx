
import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/use-translation"
import { User, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateBoardModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (name: string, type: 'personal' | 'shared') => void
}

export function CreateBoardModal({ isOpen, onClose, onCreate }: CreateBoardModalProps) {
    const [name, setName] = useState("")
    const [type, setType] = useState<'personal' | 'shared'>('personal')
    const { t } = useTranslation()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onCreate(name.trim(), type)
            setName("")
            setType('personal')
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{t('board.createTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                {t('board.boardName')}
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('board.placeholder')}
                                className="bg-secondary/30 border-border/40 focus-visible:ring-primary/20 rounded-xl h-11"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">{t('members.boardType')}</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setType('personal')}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200",
                                        type === 'personal'
                                            ? "bg-primary/5 border-primary text-primary shadow-lg shadow-primary/5"
                                            : "bg-secondary/20 border-border/40 text-muted-foreground hover:bg-secondary/30"
                                    )}
                                >
                                    <User className="w-5 h-5" />
                                    <span className="text-xs font-bold">{t('members.personal')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('shared')}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200",
                                        type === 'shared'
                                            ? "bg-primary/5 border-primary text-primary shadow-lg shadow-primary/5"
                                            : "bg-secondary/20 border-border/40 text-muted-foreground hover:bg-secondary/30"
                                    )}
                                >
                                    <Users className="w-5 h-5" />
                                    <span className="text-xs font-bold">{t('members.shared')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" className="h-11 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" disabled={!name.trim()}>
                            {t('common.create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
