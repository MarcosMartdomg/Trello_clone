
import React from "react"
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

interface ConfirmLeaveModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
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
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold tracking-tight">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="font-medium text-muted-foreground/80">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel
                        onClick={onClose}
                        className="rounded-xl border-border/40 hover:bg-secondary/50 transition-all font-semibold"
                    >
                        {t('common.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all font-bold px-6"
                    >
                        {t('common.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
