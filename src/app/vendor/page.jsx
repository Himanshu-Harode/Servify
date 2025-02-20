import Header from "@/components/Header"
import ProtectedRoute from "@/components/ProtectedRoute"

const VendorPage = () => {
  return (
    <ProtectedRoute roleRequired={["vendor"]}>
      <Header></Header>
      <div>VendorPage</div>
      
    </ProtectedRoute>
  )
}
export default VendorPage
