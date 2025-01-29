import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const HeroSection = () => {
  return (
    <div className="flex justify-center items-center gap-3 flex-col py-3 md:pt-14 md:pb-7 ">
      <h2 className="font-bold text-[24px] md:text-[46px] text-center  ">
        Your <span className="text-primary">Home Services</span>, <br />
        Just a Click Away!
      </h2>
      <h2 className="text-sm md:text-xl text-gray-500">
        Explore Best Home Sercive near you
      </h2>
      {/* <div className="mt-4 flex relative gap-3" id="Search">
        <input type="text" className="rounded-full md:w-[350px] px-6 py-3 border-[#999] outline-none border-2" placeholder="Search" name="Search" />
        <Button className="rounded-full h-[46px] ">
          <Search className="w-4 h-4 text-white"  />
        </Button>
      </div> */}
    </div>
  )
}
export default HeroSection
