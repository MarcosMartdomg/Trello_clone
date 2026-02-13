
import React, { useEffect, useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTranslation } from "@/hooks/use-translation"
import { useKanbanStore } from "@/lib/store"
import { useAuth } from "@/components/auth/auth-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, User } from "lucide-react"

interface ConfirmLeaveModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (newOwnerId?: string) => void
    title: string
    description: string
}

export function ConfirmLeaveModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
}: ConfirmLeaveModalProps) {
    const { t } = useTranslation()
    const { boards, activeBoardId } = useKanbanStore()
    const { user } = useAuth()
    const [members, setMembers] = useState<any[]>([])
    const [newOwnerId, setNewOwnerId] = useState<string>("")
    const [isOwner, setIsOwner] = useState(false)

    useEffect(() => {
        if (isOpen && activeBoardId && user) {
            const currentBoard = boards.find(b => b.id === activeBoardId)
            if (currentBoard) {
                // Determine if current user is owner
                const userIsOwner = currentBoard.ownerId === user.id
                setIsOwner(userIsOwner)

                // Get other eligible members (excluding current user/owner)
                // Filter ensuring we have valid users to transfer to
                const otherMembers = currentBoard.members.filter(m => m.id !== user.id)
                setMembers(otherMembers)

                // Pre-select first member if available
                if (otherMembers.length > 0) {
                    setNewOwnerId(otherMembers[0].id)
                } else {
                    setNewOwnerId("")
                }
            }
        }
    }, [isOpen, activeBoardId, boards, user])

    const handleConfirm = () => {
        if (isOwner && members.length > 0 && !newOwnerId) return
        onConfirm(newOwnerId || undefined)
    }

    // Determine the content based on owner status and member count
    const renderContent = () => {
        if (!isOwner) {
            // Standard leave for non-owners
            return (
                <AlertDialogDescription className="font-medium text-muted-foreground/80">
                    {description}
                </AlertDialogDescription>
            )
        }

        if (members.length === 0) {
            // Owner is the only member -> Must delete board logic (handled by parent mostly, but we clarify here)
            // Or just warn them that leaving = deleting effectively if no one else is there, 
            // but effectively the requirement says "or erase board".
            // Since this is the "Leave" modal, we might want to guide them to delete or just say "You are the only member, leaving will delete the board" if that's the logic we want, 
            // OR if the requirement says "Owner can delete OR leave", checking if they clicked "Leave" implies they want to leave.
            // If they are the ONLY member, they can't transfer. So they essentially just leave (delete).
            return (
                <div className="space-y-4">
                    <Alert variant="error" className="bg-red-500/5 border-red-500/20">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t('board.warning')}</AlertTitle>
                        <AlertDescription>
                            {t('board.ownerOnlyMemberWarning')}
                        </AlertDescription>
                    </Alert>
                    <AlertDialogDescription className="font-medium text-muted-foreground/80">
                        {description}
                    </AlertDialogDescription>
                </div>
            )
        }

        // Owner + Other Members -> Must transfer
        return (
            <div className="space-y-4">
                <AlertDialogDescription className="font-medium text-muted-foreground/80">
                    {t('board.transferOwnershipDescription')}
                </AlertDialogDescription>

                <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">{t('board.selectNewOwner')}</Label>
                    <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t('board.selectMember')} />
                        </SelectTrigger>
                        <SelectContent>
                            {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {member.avatar || member.name[0]}
                                        </div>
                                        <span>{member.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        )
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold tracking-tight">{title}</AlertDialogTitle>
                    {renderContent()}
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel
                        onClick={onClose}
                        className="rounded-xl border-border/40 hover:bg-secondary/50 transition-all font-semibold"
                    >
                        {t('common.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isOwner && members.length > 0 && !newOwnerId}
                        className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all font-bold px-6"
                    >
                        {t('common.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
