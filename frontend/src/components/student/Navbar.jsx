import React from 'react'
import {assets} from '../../assets/assets.js'
import {Link, useLocation} from 'react-router-dom'


const Navbar = () => {
    const location = useLocation();
    const isCourseListPage = location.pathname.includes('/course-list');
  return (
    <>
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-12 border-b border-gray-500 py-4  ${isCourseListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
        <img src={assets.logo} alt="logo" className="w-54 lg:w-48 cursor-pointer"></img>
        <div className="hidden md:flex items-center gap-5 text-gray-500">
            <div className='flex items-center gap-5'>
                <button> Become Educator</button> 
                |<Link  to='/my-enrollments'>My Enrollments</Link>
            </div>
            <button className="bg-blue-600 text-white px-5 py-2 rounded-full ">Create Account</button>
        </div>
        {/** For mobile view */}
        <div className='md:hidden flex items-center gap-2 sm:gap-5 text-gray-500'>
            <div>
                <button> Become Educator</button> 
                |<Link  to='/my-enrollments'>My Enrollments</Link>
            </div>
            <button><img src={assets.user_icon} alt="" /></button>
        </div>
    </div>
    </>
  )
}

export default Navbar