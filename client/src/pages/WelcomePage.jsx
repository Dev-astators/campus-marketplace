import Navbar from '../components/NavBar.jsx';
import HeroSection from '../components/HeroSection.jsx';
import CuratedCategories from '../components/HomeCategory.jsx';

function WelcomePage() {
    return(
    <>
        <Navbar />
        <HeroSection />
        <CuratedCategories />
    </>
    )
}
export default WelcomePage;