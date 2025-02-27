"use client"

import Header from "@/components/Header"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Suspense } from "react"
import Loading from "../loading"

const AdminPage = () => {
  return (
    <ProtectedRoute roleRequired={["admin"]}>
      <Suspense fallback={<Loading />}>
        <Header></Header>
        <div>Welcome, Admin!</div>
      </Suspense>
    </ProtectedRoute>
  )
}

export default AdminPage