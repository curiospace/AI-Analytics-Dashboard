import type { ReactNode } from "react";

type PanelProps = {
    title?: string,
    right?: ReactNode,
    children: ReactNode,
    className? : string
}

export function Panel({title, right, children, className = ''}: PanelProps) {
    return (
        <section className={`flex flex-col gap-4 rounded-panel border border-line bg-panel p-5 ${className} `}>
            {(title || right ) && (
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-bold">{title}</h2>
                    {right}
                </header>
            )}
            {children}
        </section>
    )
}
