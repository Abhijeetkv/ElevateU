import React, { useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';

const Loading = () => {

  const { path } = useParams();
  const navigate = useNavigate();
  const { backendUrl, getToken, fetchUserEnrolledCourses } = useContext(AppContext);

  useEffect(() => {
    const verifyAndRedirect = async () => {
      if (path) {
        try {
          const token = await getToken();
          if (token) {
            // Retry verify-payment up to 5 times (webhook may not have fired yet)
            const MAX_RETRIES = 5;
            const RETRY_DELAY = 2000; // 2 seconds

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
              try {
                const { data } = await axios.get(backendUrl + '/api/user/verify-payment', {
                  headers: { Authorization: `Bearer ${token}` }
                });

                if (data.success) {
                  console.log(`Payment verified on attempt ${attempt}`);
                  break;
                }

                // Payment not yet confirmed — wait and retry
                if (attempt < MAX_RETRIES) {
                  console.log(`Payment not confirmed yet, retrying in ${RETRY_DELAY / 1000}s... (attempt ${attempt}/${MAX_RETRIES})`);
                  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
              } catch (err) {
                console.error(`Verify attempt ${attempt} failed:`, err.message);
                if (attempt < MAX_RETRIES) {
                  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
              }
            }

            // Refresh enrolled courses after verification attempts
            await fetchUserEnrolledCourses();
          }
        } catch (error) {
          console.error('Payment verification error:', error.message);
        }
        // Navigate to the target page
        navigate(`/${path}`);
      }
    };

    verifyAndRedirect();
  }, [path]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-16 sm:w-20 aspect-square border-4 border-gray-300 
                     border-t-4 border-t-blue-400 rounded-full animate-spin mx-auto"
        ></div>
        {path && <p className="mt-4 text-gray-500 text-sm">Verifying your payment...</p>}
      </div>
    </div>
  );
};

export default Loading;

