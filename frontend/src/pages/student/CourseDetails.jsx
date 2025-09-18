import React, { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../../components/student/Loading.jsx'

const CourseDetails = () => {
  const { id } = useParams()
  const [courseData, setCourseData] = useState(null)
  const { allCourses } = useContext(AppContext)

  const fetchCourseData = () => {
    const findCourse = allCourses.find(course => course._id === id)
    setCourseData(findCourse || null)
  }

  useEffect(() => {
    if (allCourses && allCourses.length > 0) {
      fetchCourseData()
    }
  }, [allCourses, id])

  if (!courseData && allCourses.length === 0) {
    return <Loading />
  }

  if (!courseData && allCourses.length > 0) {
    return <p className="p-8">Course not found</p>
  }

  return (
    <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left ">
      <div className="absolute top-0 left-0  w-full h-[500px] z-1 bg-gradient-to-b from-cyan-100/70"></div>

      {/* left column */}
      <div className='max-w-xl z-10 text-gray-500'>
        <h1 className='md:text-4xl text-2xl font-semibold text-gray-800'>{courseData.courseTitle}</h1>
        <p className='pt-4 md:text-base text-sm'
          dangerouslySetInnerHTML={{
            __html: courseData.courseDescription.slice(0, 200)
          }}
        ></p>



        {/* review and rating */}
      </div>

      {/* right column */}
      <div></div>
    </div>
  )
}

export default CourseDetails
