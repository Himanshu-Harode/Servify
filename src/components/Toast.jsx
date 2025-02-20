import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils" // Make sure to have a utility for cn (className concatenation)

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "bg-red-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export const ToastProvider = ToastPrimitives.Provider
export const ToastViewport = ToastPrimitives.Viewport

export const Toast = ({ className, variant, ...props }) => (
  <ToastPrimitives.Root className={cn(toastVariants({ variant }), className)} {...props} />
)

export const ToastTitle = ToastPrimitives.Title
export const ToastDescription = ToastPrimitives.Description
export const ToastClose = ToastPrimitives.Close
