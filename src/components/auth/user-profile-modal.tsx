"use client"

import { useState } from "react"
import { Shield, Mail, Lock, AlertTriangle, CheckCircle2, Loader2, X, User, Bell, Camera, Check } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    const { t } = useTranslation()

    // Form states
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "")
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "")
    const [newEmail, setNewEmail] = useState(user?.email || "")
    const [newPassword, setNewPassword] = useState("")
    const [notifications, setNotifications] = useState(true)

    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<"edit" | "confirm">("edit")
    const [activeTab, setActiveTab] = useState("profile")

    const predefinedAvatars = [
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Toby",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    ]

    const handleUpdate = async () => {
        setLoading(true)
        try {
            const updates: any = { data: {} }

            if (activeTab === "profile") {
                updates.data.full_name = fullName
                updates.data.avatar_url = avatarUrl
            } else if (activeTab === "security") {
                if (newEmail !== user?.email) updates.email = newEmail
                if (newPassword) updates.password = newPassword
            }

            const { error } = await supabase.auth.updateUser(updates)
            if (error) throw error

            // Also update the profiles table for consistency
            if (activeTab === "profile") {
                await supabase.from('profiles').update({
                    full_name: fullName,
                    avatar_url: avatarUrl
                }).eq('id', user?.id)
            }

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
        setFullName(user?.user_metadata?.full_name || "")
        setAvatarUrl(user?.user_metadata?.avatar_url || "")
        setNewEmail(user?.email || "")
        setNewPassword("")
    }

    const hasChanges = () => {
        if (activeTab === "profile") {
            return fullName !== (user?.user_metadata?.full_name || "") || avatarUrl !== (user?.user_metadata?.avatar_url || "")
        }
        if (activeTab === "security") {
            return newEmail !== user?.email || newPassword.length > 0
        }
        return false
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetModal()
            onOpenChange(val)
        }}>
            <DialogContent className="sm:max-w-[440px] bg-card/40 backdrop-blur-3xl border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[32px] overflow-hidden p-0 gap-0">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-950 via-slate-500 to-slate-950" />

                <div className="p-8 space-y-8">
                    <DialogHeader className="space-y-4">
                        <div className="flex justify-center">
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl",
                                step === "edit" ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-amber-500/20 text-amber-500 shadow-amber-500/10 rotate-3"
                            )}>
                                {step === "edit" ? (
                                    activeTab === "profile" ? <User className="w-8 h-8" /> :
                                        activeTab === "security" ? <Shield className="w-8 h-8" /> :
                                            <Bell className="w-8 h-8" />
                                ) : <AlertTriangle className="w-8 h-8 animate-pulse" />}
                            </div>
                        </div>
                        <div className="text-center space-y-1.5">
                            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                                {step === "edit" ? t('profile.title') : t('common.warning') + "!"}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground/80 font-medium">
                                {step === "edit" ? t('profile.subtitle') : t('profile.confirm1')}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {step === "edit" ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid grid-cols-3 bg-secondary/30 p-1 rounded-2xl h-12 mb-8">
                                <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest transition-all">
                                    {t('auth.profile')}
                                </TabsTrigger>
                                <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest transition-all">
                                    {t('auth.security')}
                                </TabsTrigger>
                                <TabsTrigger value="preferences" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest transition-all">
                                    {t('auth.preferences')}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center gap-6 pb-2">
                                        <div className="relative group">
                                            <Avatar className="h-28 w-28 ring-4 ring-primary/10 shadow-2xl transition-all group-hover:ring-primary/20">
                                                <AvatarImage src={avatarUrl} />
                                                <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">
                                                    {fullName[0] || user?.email?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <button className="absolute bottom-0 right-0 p-2.5 bg-black text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border-2 border-background">
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-6 gap-2">
                                            {predefinedAvatars.map((url, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setAvatarUrl(url)}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95",
                                                        avatarUrl === url ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-transparent opacity-60 hover:opacity-100"
                                                    )}
                                                >
                                                    <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                                            {t('profile.name')}
                                        </Label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="pl-12 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-2xl transition-all"
                                                placeholder="Flow User"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        disabled={!hasChanges()}
                                        onClick={() => setStep("confirm")}
                                        className="w-full h-14 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-wider shadow-xl shadow-black/10 transition-all active:scale-95"
                                    >
                                        {t('profile.saveChanges')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="security" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-5">
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">
                                            {t('profile.email')}
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
                                </div>

                                <div className="pt-2">
                                    <Button
                                        disabled={!hasChanges()}
                                        onClick={() => setStep("confirm")}
                                        className="w-full h-14 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-wider shadow-xl shadow-black/10 transition-all active:scale-95"
                                    >
                                        {t('profile.saveChanges')}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="preferences" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-6 py-4">
                                    <div className="flex items-center justify-between p-4 rounded-3xl bg-secondary/20 border border-white/5 group hover:bg-secondary/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                                                <Bell className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold">{t('profile.notifications')}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-70">
                                                    {t('profile.enableNotifications')}
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={notifications}
                                            onCheckedChange={setNotifications}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={() => onOpenChange(false)}
                                        className="w-full h-14 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-wider shadow-xl shadow-black/10 transition-all active:scale-95"
                                    >
                                        {t('common.ready')}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 text-center space-y-4">
                                <p className="text-sm font-bold text-amber-500 leading-relaxed">
                                    {t('profile.confirm1')}
                                </p>
                                <p className="text-xs text-amber-500/60 font-medium italic">
                                    {t('profile.confirm2')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 pb-2">
                                <Button
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-wider shadow-xl shadow-amber-500/20 transition-all"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('common.confirm')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep("edit")}
                                    className="w-full h-12 rounded-xl text-muted-foreground font-bold hover:text-foreground"
                                >
                                    {t('common.cancel')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
