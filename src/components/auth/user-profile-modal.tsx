"use client"

import { useState } from "react"
import { Shield, Mail, Lock, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

interface UserProfileModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
    const { user } = useAuth()
    const [newEmail, setNewEmail] = useState(user?.email || "")
    const [newPassword, setNewPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<"edit" | "confirm-1" | "confirm-2">("edit")
    const { t } = useTranslation()

    const handleUpdate = async () => {
        setLoading(true)
        try {
            const updates: any = {}
            if (newEmail !== user?.email) updates.email = newEmail
            if (newPassword) updates.password = newPassword

            const { error } = await supabase.auth.updateUser(updates)

            if (error) throw error

            toast.success(t('profile.updateSuccess'))
            if (updates.email) {
                toast.info(t('profile.checkEmail'))
            }
            onOpenChange(false)
            setStep("edit")
            setNewPassword("")
        } catch (error: any) {
            toast.error(error.message || t('profile.updateError'))
        } finally {
            setLoading(false)
        }
    }

    const resetModal = () => {
        setStep("edit")
        setNewEmail(user?.email || "")
        setNewPassword("")
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetModal()
            onOpenChange(val)
        }}>
            <DialogContent className="sm:max-w-[440px] bg-card/40 backdrop-blur-3xl border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[32px] overflow-hidden p-0 gap-0">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-blue-500 to-primary/50" />

                <div className="p-8 space-y-6">
                    <DialogHeader className="space-y-4">
                        <div className="flex justify-center">
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl",
                                step === "edit" ? "bg-primary/20 text-primary shadow-primary/10" :
                                    step === "confirm-1" ? "bg-amber-500/20 text-amber-500 shadow-amber-500/10 rotate-3" :
                                        "bg-red-500/20 text-red-500 shadow-red-500/10 rotate-6"
                            )}>
                                {step === "edit" ? <Shield className="w-8 h-8" /> :
                                    step === "confirm-1" ? <AlertTriangle className="w-8 h-8" /> :
                                        <AlertTriangle className="w-8 h-8 animate-pulse" />}
                            </div>
                        </div>
                        <div className="text-center space-y-1.5">
                            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                                {step === "edit" ? t('profile.title') :
                                    step === "confirm-1" ? t('common.warning') + "!" :
                                        t('profile.finalWarning')}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                {step === "edit" ? t('profile.subtitle') :
                                    step === "confirm-1" ? t('profile.confirm1') :
                                        t('profile.confirm2')}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {step === "edit" ? (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                                    {t('auth.email')}
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="pl-12 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                                    {t('profile.newPassword')}
                                </Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-12 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    disabled={newEmail === user?.email && !newPassword}
                                    onClick={() => setStep("confirm-1")}
                                    className="w-full h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold shadow-lg shadow-primary/20 transition-all border-0"
                                >
                                    {t('profile.saveChanges')}
                                </Button>
                            </div>
                        </div>
                    ) : step === "confirm-1" ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                                <p className="text-sm font-medium text-amber-500">
                                    {t('profile.confirm1')}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pb-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep("edit")}
                                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-foreground hover:bg-white/10 border-0"
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    onClick={() => setStep("confirm-2")}
                                    className="h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-bold border-0 shadow-lg shadow-amber-500/20"
                                >
                                    {t('common.confirm')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                                <p className="text-sm font-black text-red-500 uppercase tracking-tight">
                                    {t('profile.finalWarning')}
                                </p>
                                <div className="mt-3 text-left space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('profile.newEmail')}:</p>
                                    <p className="text-xs font-mono bg-black/20 p-2 rounded-lg truncate">{newEmail}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pb-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep("edit")}
                                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-foreground hover:bg-white/10 border-0"
                                >
                                    {t('profile.title')}
                                </Button>
                                <Button
                                    disabled={loading}
                                    onClick={handleUpdate}
                                    className="h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black border-0 shadow-lg shadow-red-500/20"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('common.confirm')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
