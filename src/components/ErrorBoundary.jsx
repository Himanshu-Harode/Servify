"use client"

import { Component } from "react"

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-full w-full flex items-center justify-center bg-red-50 rounded-lg p-4">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-red-600">Map Loading Failed</h3>
                        <p className="text-sm text-red-500 mt-2">We couldn't load the map. Please try again later.</p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

