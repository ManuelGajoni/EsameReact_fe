import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <SearchBar />
      <HeroSection />
      <Footer />
    </div>
  );
}
