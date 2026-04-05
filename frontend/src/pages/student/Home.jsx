import Hero from '../../components/student/Hero.jsx'
import CoursesSection from '../../components/student/CoursesSection.jsx'
import CallToAction from '../../components/student/CallToAction.jsx'
import Footer from '../../components/student/Footer.jsx'

const Home = () => {
  return (
    <>
    <div className='flex flex-col item-center space-y-7 text-center'>
      <Hero />
      <CoursesSection />
      <CallToAction />
      <Footer />
    </div>
    </>
  )
}

export default Home