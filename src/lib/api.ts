
import { KanbanColumn } from "./kanban-data";

// Simulated delay to mimic network requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
    // Save the entire board state (e.g., after reordering columns)
    saveBoardState: async (columns: KanbanColumn[]): Promise<boolean> => {
        await delay(500);
        // In a real app, this would send a PUT request to update the board
        console.log("API: Board state saved", columns);
        return true;
    },

    // Update a specific card's position (e.g., drag and drop)
    updateCardPosition: async (
        cardId: string,
        listId: string,
        order: number
    ): Promise<boolean> => {
        await delay(300);
        // In a real app, this would send a PATCH request to update the card
        console.log(
            `API: Card ${cardId} moved to list ${listId} at position ${order}`
        );
        return true;
    },

    // Persist data to localStorage for this demo
    persistToStorage: (columns: KanbanColumn[]) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("kanban-storage", JSON.stringify(columns));
        }
    },

    loadFromStorage: (): KanbanColumn[] | null => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("kanban-storage");
            if (stored) {
                return JSON.parse(stored);
            }
        }
        return null;
    }
};
