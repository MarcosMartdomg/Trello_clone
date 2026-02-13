"use client"

import React from "react"
import { useKanbanStore } from "@/lib/store"
import { Alert, AlertTitle, AlertDescription, AlertContent } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Layout, Check, X } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

import { useAuth } from "@/components/auth/auth-provider"

export function NotificationToaster() {
    const { activeNotifications, removeNotification, acceptInvitation, declineInvitation } = useKanbanStore()
    const { user } = useAuth()
    const { t } = useTranslation()
    const [processingIds, setProcessingIds] = React.useState<string[]>([])

    const userNotifications = activeNotifications.filter(n => n.userId === user?.id)

    if (userNotifications.length === 0) return null

    const handleAction = async (id: string, action: () => Promise<void>) => {
        setProcessingIds(prev => [...prev, id])
        try {
            await action()
        } finally {
            removeNotification(id)
            setProcessingIds(prev => prev.filter(pid => pid !== id))
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4">
            {userNotifications.map((notification) => {
                const isInvitation = notification.type === 'invitation';
                const isSystem = notification.type === 'system';
                const isProcessing = processingIds.includes(notification.id);

                return (
                    <Alert
                        key={notification.id}
                        isNotification
                        variant={isSystem ? "success" : "default"}
                        icon={isInvitation ? <Layout className="w-5 h-5 text-primary" /> : <Check className="w-5 h-5 text-green-500" />}
                        layout="complex"
                        className="border-primary/20 backdrop-blur-xl min-w-[320px] shadow-2xl transition-all animate-in fade-in slide-in-from-right-5"
                    >
                        <AlertContent>
                            <AlertTitle className="font-bold flex items-center justify-between">
                                {isInvitation
                                    ? t('members.invitationFrom', { name: notification.boardName })
                                    : t('board.system')
                                }
                                <button
                                    onClick={() => removeNotification(notification.id)}
                                    className="text-muted-foreground hover:text-foreground transition-colors ml-4"
                                    disabled={isProcessing}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </AlertTitle>

                            <AlertDescription className="mt-1">
                                {isInvitation
                                    ? t('members.invitationDescription')
                                    : (notification.message
                                        ? (notification.message.includes('.') ? t(notification.message, { name: notification.boardName }) : t(`board.${notification.message}`, { name: notification.boardName }))
                                        : notification.text)
                                }
                            </AlertDescription>

                            {isInvitation && (
                                <div className="flex items-center gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 rounded-lg text-xs font-bold"
                                        disabled={isProcessing}
                                        onClick={() => handleAction(notification.id, () => declineInvitation(notification.boardId, notification.userId))}
                                    >
                                        {t('members.decline')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 rounded-lg text-xs font-black shadow-lg shadow-primary/20"
                                        disabled={isProcessing}
                                        onClick={() => handleAction(notification.id, () => acceptInvitation(notification.boardId, notification.userId))}
                                    >
                                        {isProcessing ? (
                                            <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1.5" />
                                        ) : (
                                            <Check className="w-3.5 h-3.5 mr-1.5" />
                                        )}
                                        {t('members.accept')}
                                    </Button>
                                </div>
                            )}
                        </AlertContent>
                    </Alert>
                );
            })}
        </div>
    )
}
