import React, { useContext, useEffect, useState } from 'react';
import assets from '../assets/assets';
import { AppContext } from '../context/AppContext';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db, requestHandler, acceptRequest } from '../config/firebase';

const Notifications = ({ setShowNotifications, fetchFriends }) => {
  const { userData } = useContext(AppContext);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!userData?.id) return;

    const q = query(
      collection(db, 'request'),
      where('to', '==', userData.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(requestsList);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleRequest = async (requestId, status) => {
    try {
      await requestHandler(requestId, status);

      if (status === 'accepted') {
        await acceptRequest(requestId);
        await fetchFriends(); // Refresh friends list after acceptance
      }
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  return (
    <div className="absolute top-0 left-0 z-10 grid w-full h-full bg-shadow">
      <div className="bg-white place-self-center w-[calc(max(23vw,330px))] flex flex-col gap-6 rounded-lg py-6 px-8 text-base">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-customBlack">Notifications</h2>
          <img
            className="w-5 h-5 cursor-pointer"
            src={assets.cross_icon}
            onClick={() => setShowNotifications(false)}
            alt="Close"
          />
        </div>

        {requests.length > 0 ? (
          requests.map((request) => (
            <div key={request.id} className="flex items-center justify-between">
              <img
                className="rounded-full w-9 aspect-square"
                src={request.avatar || assets.avatar_icon}
                alt={`${request.sendername}'s avatar`}
              />
              <p className="text-sm text-customBlack">
                {request.sendername} sent you a request
              </p>
              <div className="flex gap-3">
                <button onClick={() => handleRequest(request.id, 'reject')}>
                  <img className="w-5" src={assets.reject_icon} alt="Reject" />
                </button>
                <button onClick={() => handleRequest(request.id, 'accepted')}>
                  <img className="w-5" src={assets.accept_icon} alt="Accept" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-center text-gray-500">No new friend requests.</p>
        )}
      </div>
    </div>
  );
};

export default Notifications;
