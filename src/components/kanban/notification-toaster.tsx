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

    const userNotifications = activeNotifications.filter(n => n.userId === user?.id)

    if (userNotifications.length === 0) return null

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4">
            {userNotifications.map((notification) => (
                <Alert
                    key={notification.id}
                    isNotification
                    variant="default"
                    icon={<Layout className="w-5 h-5 text-primary" />}
                    layout="complex"
                    className="border-primary/20 backdrop-blur-xl"
                >
                    <AlertContent>
                        <AlertTitle className="font-bold flex items-center justify-between">
                            {t('members.invitationFrom', { name: notification.boardName })}
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </AlertTitle>
                        <AlertDescription className="mt-1">
                            Has sido invitado a este tablero compartido.
                        </AlertDescription>
                        <div className="flex items-center gap-2 mt-4">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg text-xs font-bold"
                                onClick={async () => {
                                    await declineInvitation(notification.boardId, notification.userId)
                                    removeNotification(notification.id)
                                }}
                            >
                                {t('members.decline')}
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 rounded-lg text-xs font-black shadow-lg shadow-primary/20"
                                onClick={async () => {
                                    await acceptInvitation(notification.boardId, notification.userId)
                                    removeNotification(notification.id)
                                }}
                            >
                                <Check className="w-3.5 h-3.5 mr-1.5" />
                                {t('members.accept')}
                            </Button>
                        </div>
                    </AlertContent>
                </Alert>
            ))}
        </div>
    )
}
