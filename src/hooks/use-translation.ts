import { useKanbanStore } from "../lib/store"
import { translations } from "../lib/translations"

export function useTranslation() {
    const language = useKanbanStore((state: any) => state.language)

    const t = (path: string, params?: Record<string, string>) => {
        const keys = path.split('.')
        let current: any = (translations as any)[language]

        if (!current) {
            console.warn(`Language not found: ${language}`)
            return path
        }

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation key not found: ${path}`)
                return path
            }
            current = current[key]
        }

        if (typeof current !== 'string') return path

        if (params) {
            let result = current
            Object.entries(params).forEach(([key, value]) => {
                result = result.replace(`{${key}}`, value)
            })
            return result
        }

        return current
    }

    return { t, language }
}
