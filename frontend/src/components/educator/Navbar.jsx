import React from 'react'
import {assets, dummyEducatorData } from '../../assets/assets'
import { useUser } from '../../context/UserContext'

const Navbar = () => {
    const educatorData = dummyEducatorData;
    const {user} = useUser()
  return (
    <>
        <div>
            <Link to=''>
            <img src={assets.logo} alt="Logo" className='w-28' lg:w-32 />
            </Link>
        </div>
    </>
  )
}

export default Navbar