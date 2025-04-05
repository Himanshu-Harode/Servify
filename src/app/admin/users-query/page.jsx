"use client"
import React, { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FiCheck, FiClock, FiMail } from "react-icons/fi"
import { firestore } from "@/context/Firebase"
import { collection, doc, updateDoc, onSnapshot } from "firebase/firestore"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const UserQuery = () => {
    const { toast } = useToast()
    const [pendingQueries, setPendingQueries] = useState([])
    const [resolvedQueries, setResolvedQueries] = useState([])
    const [usersData, setUsersData] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribeQueries = onSnapshot(
            collection(firestore, "customerSupport"),
            async (snapshot) => {
                const queries = []
                snapshot.forEach((doc) => {
                    queries.push({
                        id: doc.id,
                        ...doc.data()
                    })
                })

                setPendingQueries(queries.filter(q => q.status === 'pending'))
                setResolvedQueries(queries.filter(q => q.status === 'resolved'))
            }
        )

        const unsubscribeUsers = onSnapshot(collection(firestore, "users"), (snapshot) => {
            const users = {}
            snapshot.forEach((doc) => {
                users[doc.id] = doc.data()
            })
            setUsersData(users)
            setLoading(false)
        })

        return () => {
            unsubscribeQueries()
            unsubscribeUsers()
        }
    }, [])

    const handleResolveQuery = async (queryId) => {
        try {
            await updateDoc(doc(firestore, "customerSupport", queryId), {
                status: "resolved"
            })
            toast({
                title: "Success",
                description: "Query marked as resolved",
                variant: "success"
            })
        } catch (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        }
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return "N/A"
        const date = timestamp.toDate()
        return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
    }

    const getUserInfo = (userId) => {
        if (!userId || !usersData[userId]) return {
            name: "Unknown User",
            email: "No email"
        }
        const user = usersData[userId]
        return {
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            email: user.email
        }
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Customer Support</h1>
                <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
                    Manage user queries and issues
                </p>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-xs md:max-w-sm mx-auto">
                    <TabsTrigger
                        value="pending"
                        className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-full"
                    >
                        <FiClock className="mr-2"/>
                        <span className="hidden sm:inline">Pending</span>
                        <span className="sm:hidden">Pending</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="resolved"
                        className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-full"
                    >
                        <FiCheck className="mr-2"/>
                        <span className="hidden sm:inline">Resolved</span>
                        <span className="sm:hidden">Resolved</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    <Card className="mt-4 md:mt-6 rounded-xl md:rounded-2xl shadow-sm">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full rounded-lg"/>
                                ))}
                            </div>
                        ) : pendingQueries.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FiCheck className="mx-auto h-10 w-10 mb-3 md:h-12 md:w-12 md:mb-4"/>
                                <p className="text-sm md:text-base">No pending queries</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-full">
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="rounded-tl-xl md:rounded-tl-2xl px-3 md:px-4">Sr</TableHead>
                                            <TableHead className="px-3 md:px-4">User Details</TableHead>
                                            <TableHead className="px-3 md:px-4">Query</TableHead>
                                            <TableHead className="hidden sm:table-cell px-3 md:px-4">Date</TableHead>
                                            <TableHead className="rounded-tr-xl md:rounded-tr-2xl px-3 md:px-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingQueries.map((query, index) => {
                                            const user = getUserInfo(query.userId)
                                            return (<TableRow key={query.id} className="hover:bg-muted/10 transition-colors">
                                                <TableCell className="px-3 md:px-4 py-3">{index + 1}</TableCell>
                                                <TableCell className="px-3 md:px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.name}</span>
                                                        <span className="text-xs text-muted-foreground flex items-center">
                              <FiMail className="mr-1 h-3 w-3"/>
                                                            {user.email}
                            </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-3 md:px-4 py-3 max-w-[150px] md:max-w-xs truncate">
                                                    {query.query}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell px-3 md:px-4 py-3">
                                                    {formatDate(query.timestamp)}
                                                </TableCell>
                                                <TableCell className="px-3 md:px-4 py-3">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleResolveQuery(query.id)}
                                                        className="rounded-full flex items-center gap-1"
                                                    >
                                                        <FiCheck className="w-3 h-3 md:w-4 md:h-4"/>
                                                        <span className="hidden md:inline">Resolve</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>)
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="resolved">
                    <Card className="mt-4 md:mt-6 rounded-xl md:rounded-2xl shadow-sm">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full rounded-lg"/>
                                ))}
                            </div>
                        ) : resolvedQueries.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FiClock className="mx-auto h-10 w-10 mb-3 md:h-12 md:w-12 md:mb-4"/>
                                <p className="text-sm md:text-base">No resolved queries</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-full">
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="rounded-tl-xl md:rounded-tl-2xl px-3 md:px-4">Sr</TableHead>
                                            <TableHead className="px-3 md:px-4">User Details</TableHead>
                                            <TableHead className="px-3 md:px-4">Query</TableHead>
                                            <TableHead className="hidden sm:table-cell px-3 md:px-4">Date</TableHead>
                                            <TableHead className="rounded-tr-xl md:rounded-tr-2xl px-3 md:px-4">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {resolvedQueries.map((query, index) => {
                                            const user = getUserInfo(query.userId)
                                            return (<TableRow key={query.id} className="hover:bg-muted/10 transition-colors">
                                                <TableCell className="px-3 md:px-4 py-3">{index + 1}</TableCell>
                                                <TableCell className="px-3 md:px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.name}</span>
                                                        <span className="text-xs text-muted-foreground flex items-center">
                              <FiMail className="mr-1 h-3 w-3"/>
                                                            {user.email}
                            </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-3 md:px-4 py-3 max-w-[150px] md:max-w-xs truncate">
                                                    {query.query}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell px-3 md:px-4 py-3">
                                                    {formatDate(query.timestamp)}
                                                </TableCell>
                                                <TableCell className="px-3 md:px-4 py-3">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-green-100 text-green-800 border-green-200 rounded-full"
                                                    >
                                                        Resolved
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>)
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default UserQuery
