import React, { useContext, useState, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import {
  updateDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import assets from '../assets/assets';

const FriendsList = () => {
  const {
    friends,
    userData,
    setMessageId,
    setSelectedFriend,
    setSelectedGroup,
    setIsChatOpen,
  } = useContext(AppContext);
  const [imageError, setImageError] = useState({});

  const handleImageError = useCallback((friendId) => {
    setImageError((prev) => ({ ...prev, [friendId]: true }));
  }, []);

  const openChat = useCallback(
    async (friend) => {
      try {
        const chatId = [userData.id, friend.friend.id].sort().join('_');
        const chatDocRef = doc(db, 'chats', chatId);

        const chatSnap = await getDoc(chatDocRef);

        // Firestore write only if necessary
        if (!chatSnap.exists()) {
          await setDoc(chatDocRef, {
            chatId,
            lastMessage: '',
            updatedAt: serverTimestamp(),
            messageSeen: false,
          });
        } else if (!chatSnap.data().messageSeen) {
          await updateDoc(chatDocRef, {
            messageSeen: true,
          });
        }

        setIsChatOpen(true);
setSelectedFriend({
  friend: friend.friend,
  lastMessage: friend.lastMessage,
  isUnread: friend.isUnread
});        setSelectedGroup(null);
        setMessageId(chatDocRef.id);
        
      } catch (error) {
        console.error('Error opening chat:', error);
      }
    },
    [userData.id, setIsChatOpen, setSelectedFriend, setSelectedGroup, setMessageId]
  );

  return (
    <div>
      {friends.map((friend, index) => {
        const { friend: friendData, isUnread, friendsId, lastMessage } = friend;
        const isUnreadByCurrentUser = isUnread && friendsId === userData.id;

        return (
          <div
            key={index}
            className="flex items-center gap-3 px-5 py-2 cursor-pointer"
            onClick={() => openChat(friend)}
          >
            <img
              className={`w-9 aspect-square rounded-full ${
                isUnreadByCurrentUser ? 'border-2 border-red-500' : ''
              }`}
              src={
                imageError[friendData.id] || !friendData.avatar
                  ? assets.avatar_icon
                  : friendData.avatar
              }
              alt={`${friendData.username || 'Friend'}'s avatar`}
              onError={() => handleImageError(friendData.id)}
            />
            <div className="flex flex-col justify-end h-10">
              <p className="font-semibold text-md">
                {friendData.username || 'Unknown'}
              </p>
              {lastMessage === 'Image' ? (
                <img className="h-3" src={assets.image_icon} alt="Image" />
              ) : (
                <p
                  className={`text-xs overflow-hidden truncate max-w-48 ${
                    isUnreadByCurrentUser ? 'text-red-600' : 'text-white'
                  }`}
                >
                  {lastMessage}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FriendsList;
