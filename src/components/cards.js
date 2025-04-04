// components/ui/cards.js
"use client"
import { cn } from "@/lib/utils"

export const Card = ({ className, children, ...props }) => (
    <div
        className={cn(
            "rounded-xl border bg-card text-card-foreground shadow",
            className
        )}
        {...props}
    >
        {children}
    </div>
)

export const MetricCard = ({ title, value, total, trend, icon, color }) => (
    <Card className="p-6 relative overflow-hidden">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <p className="text-3xl font-bold mt-1">{value}</p>
                {total && (
                    <p className="text-sm text-muted-foreground mt-1">Total: {total}</p>
                )}
                {trend && (
                    <p className="text-sm text-green-500 mt-1">{trend}</p>
                )}
            </div>
            <div className={`${color} p-3 rounded-lg`}>
                {icon}
            </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${color} opacity-20`} />
    </Card>
)

export const StatBadge = ({ label, value }) => (
    <div className="bg-muted/50 dark:bg-muted/30 p-3 rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="font-medium text-lg">{value}</p>
    </div>
)
