import React from 'react'
import Hero from '../../components/student/Hero.jsx'
import Companies from '../../components/student/Companies.jsx'
import CoursesSection from '../../components/student/CoursesSection.jsx'

const Home = () => {
  return (
    <>
    <div className='flex flex-col item-center space-y-7 text-center'>
      <Hero />
      <Companies />
      <CoursesSection />
    </div>
    </>
  )
}

export default Home