
import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateBoardModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (name: string) => void
}

export function CreateBoardModal({ isOpen, onClose, onCreate }: CreateBoardModalProps) {
    const [boardName, setBoardName] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (boardName.trim()) {
            onCreate(boardName.trim())
            setBoardName("")
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Board</DialogTitle>
                        <DialogDescription>
                            Give your new workspace a name to get started.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Board Name</Label>
                            <Input
                                id="name"
                                value={boardName}
                                onChange={(e) => setBoardName(e.target.value)}
                                placeholder="e.g. Marketing Campaign"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!boardName.trim()}>
                            Create Board
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
