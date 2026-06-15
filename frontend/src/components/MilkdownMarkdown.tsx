import { useEffect, useRef } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

type MilkdownMarkdownProps = {
  markdown: string
  className?: string
}

export default function MilkdownMarkdown({ markdown, className = '' }: MilkdownMarkdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!rootRef.current) return
    let cancelled = false
    let crepe: Crepe | null = null

    const initialize = async () => {
      crepe = new Crepe({
        root: rootRef.current,
        defaultValue: markdown || ' ',
        features: {
          [Crepe.Feature.Toolbar]: false,
          [Crepe.Feature.BlockEdit]: false,
          [Crepe.Feature.Placeholder]: false,
        },
      }).setReadonly(true)

      await crepe.create()
      crepe.setReadonly(true)

      if (cancelled) {
        await crepe.destroy()
      }
    }

    void initialize()

    return () => {
      cancelled = true
      if (crepe) {
        void crepe.destroy()
      }
    }
  }, [markdown])

  return <div ref={rootRef} className={`milkdown-render ${className}`} />
}
