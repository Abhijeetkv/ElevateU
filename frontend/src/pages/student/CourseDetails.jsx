import React, { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext.jsx'
import Loading from '../../components/student/Loading.jsx'
import { assets } from '../../assets/assets.js'

const CourseDetails = () => {
  const { id } = useParams()
  const [courseData, setCourseData] = useState(null)
  const { allCourses, calculateRating, calculateChapterTime, calculateCourseDuration, calculateNoOfLectures } = useContext(AppContext)

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
          <div className='flex items-center space-x-2 pt-3 pb-1 text-sm'>
              <p>{calculateRating(courseData)}</p>
                  <div className='flex'>
                      {[...Array(5)].map((_, i) => (<img key={i} src={i < Math.floor(calculateRating(courseData)) ? assets.star : assets.star_blank} alt='' className='w-3.5 h-3.5' />))}
                  </div>
                      <p className='text-blue-600'>({courseData.courseRatings.length} {courseData.courseRatings.length === 1 ? 'Rating' : 'Ratings'})</p>

                      <p>{courseData.enrolledStudents.length} {courseData.enrolledStudents.length > 1 ? 'Students' : 'Student'}</p>
          </div>

          <p className='text-sm'>Course by <span className='text-blue-600 underline'>Jeet verma</span></p>
          
          <div className='pt-8 text-gray-800'>
            <h2 className="text-xl font-semibold">
              Course Structure
            </h2>

            <div className="pt-5">
              {courseData.courseContent.map((chapter, index) => (
                <div key={index} className='border border-gray-300 bg-white mb-2
              rounded'>
                    <div className='flex items-center justify-between px-4 py-3
              cursor-pointer select-none'>
                       <div className='flex items-center gap-2'>
                         <img src={assets.down_arrow_icon} alt="arrow icon" />
                         <p className='font-medium md:text-base text-sm'>{chapter.
                         chapterTitle}</p>
                       </div>
                       <p className='text-sm md:text-default'>{chapter.chapterContent.
                       length} lectures - {calculateChapterTime(chapter)}</p>
                   </div>

                   <div>
                    <ul>
                      {chapter.chapterContent.map((lecture, i) => (
                        <li></li>
                      ))}
                    </ul>
                   </div>
              </div>
              ))}
            </div>
          </div>

      </div>

      {/* right column */}
      <div></div>
    </div>
  )
}

export default CourseDetails
