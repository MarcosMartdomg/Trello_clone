"use client"

import { useEffect, useState } from "react"
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from "@/components/ui/command"
import { useKanbanStore } from "@/lib/store"
import { LayoutDashboard, CheckSquare, Calendar, CreditCard } from "lucide-react"

export function GlobalSearch() {
    const {
        boards,
        setActiveBoard,
        setCurrentView,
        isSearchOpen,
        setSearchOpen
    } = useKanbanStore()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                // Use functional update if possible, or just force toggle based on current value available in closure
                // or just rely on store action. 
                // Since I have isSearchOpen from state, I can toggle it.
                setSearchOpen(!isSearchOpen)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [isSearchOpen, setSearchOpen])

    const runCommand = (command: () => void) => {
        setSearchOpen(false)
        command()
    }

    return (
        <CommandDialog open={isSearchOpen} onOpenChange={setSearchOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Navigation">
                    <CommandItem
                        onSelect={() => {
                            runCommand(() => setCurrentView("boards-list"))
                        }}
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>All Boards</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => {
                            runCommand(() => setCurrentView("my-tasks"))
                        }}
                    >
                        <CheckSquare className="mr-2 h-4 w-4" />
                        <span>My Tasks</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => {
                            runCommand(() => setCurrentView("calendar"))
                        }}
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Calendar</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Boards">
                    {boards.map((board) => (
                        <CommandItem
                            key={board.id}
                            onSelect={() => {
                                runCommand(() => {
                                    setActiveBoard(board.id)
                                    setCurrentView("board")
                                })
                            }}
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>{board.name}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
