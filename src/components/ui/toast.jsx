"use client";
import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-xs p-4",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between space-x-4 overflow-hidden rounded-[5px] border p-4 pr-8 shadow-neumorphic transition-all",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-gray-700 to-gray-900 border-gray-600 text-white",
        success: "bg-gradient-to-br from-green-500 to-green-700 border-green-400 text-white",
        info: "bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400 text-white",
        warning: "bg-gradient-to-br from-yellow-500 to-yellow-700 border-yellow-400 text-white",
        destructive: "bg-gradient-to-br from-red-500 to-red-700 border-red-400 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  const Icon = {
    success: CheckCircle,
    info: Info,
    warning: AlertTriangle,
    destructive: AlertCircle,
    default: Info,
  }[variant || "default"];

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 shrink-0 text-white/80" />
        <div className="flex-1">
          {props.children}
        </div>
      </div>
      <ToastClose />
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 items-center justify-center rounded-[5px ] border px-3 text-sm font-medium transition-colors hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      "group-[.success]:border-green-300 group-[.success]:bg-green-400 group-[.success]:hover:bg-green-300",
      "group-[.info]:border-blue-300 group-[.info]:bg-blue-400 group-[.info]:hover:bg-blue-300",
      "group-[.warning]:border-yellow-300 group-[.warning]:bg-yellow-400 group-[.warning]:hover:bg-yellow-300",
      "group-[.destructive]:border-red-300 group-[.destructive]:bg-red-400 group-[.destructive]:hover:bg-red-300",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-[5px] p-1 text-white/50 transition-opacity hover:text-white focus:opacity-100 focus:outline-none focus:ring-2",
      "group-[.success]:text-green-200 group-[.success]:hover:text-green-100",
      "group-[.info]:text-blue-200 group-[.info]:hover:text-blue-100",
      "group-[.warning]:text-yellow-200 group-[.warning]:hover:text-yellow-100",
      "group-[.destructive]:text-red-200 group-[.destructive]:hover:text-red-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold text-white", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm text-white/80", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};