import { createContext , useEffect, useState} from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humnanizeDuration from 'humanize-duration';

export const AppContext = createContext(null);

export const AppContextProvider = (props) => {

    const currency = import.meta.env.VITE_CURRENCY

    const [allCourses, setAllCourses] =useState([])
    const [isEducator, setIsEducator] = useState(true)
    const [enrolledCourses, setEnrolledCourses] = useState([])

    const navigate = useNavigate()

    // fetch all courses
    const fetchAllCourses = async () => {
        setAllCourses(dummyCourses)
    }

    // function to calculate average rating of course
    const calculateRating = (course) => {
        if(course.courseRatings.length === 0){
            return 0;
        }
        let totalRating = 0;
        course.courseRatings.forEach(rating => {
            totalRating += rating.rating
        })
        return totalRating / course.courseRatings.length;
    }


    // function to calculate course chapter time
    const calculateChapterTime = (chapter) => {
        let time = 0 ;
        chapter.chapterContent.map((lecture) => time += lecture.lectureDuration)
        return humnanizeDuration(time * 60 * 1000, { units: ['h', 'm'] });
    }

    //function to calculate course duration
    const calculateCourseDuration = (course) => {
        let time = 0 ;

        course.courseContent.map((chapter) => chapter.chapterContent.map((lecture) => time += lecture.lectureDuration))
        return humnanizeDuration(time * 60 * 1000, { units: ['h', 'm'] });
    }

    //function to calculate no. of lectures in course
    const calculateNoOfLectures = (course) => {
        let totalLectures = 0 ;
        course.courseContent.forEach((chapter) => {
            if(Array.isArray(chapter.chapterContent)){
                totalLectures += chapter.chapterContent.length;
            }
        })
        return totalLectures;
    }

    // fetch user Enrolled courses
    const fetchUserEnrolledCourses = async () => {
        // api call to fetch user enrolled courses
        setEnrolledCourses(dummyCourses)
    }

    useEffect(() => {
        fetchAllCourses()
        fetchUserEnrolledCourses()
    },[])

    const value = {
        currency ,
        allCourses,
        navigate,
        calculateRating,
        isEducator,
        setIsEducator,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        enrolledCourses,
        fetchUserEnrolledCourses
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}