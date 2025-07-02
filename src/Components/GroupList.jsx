import React, { useContext, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import assets from '../assets/assets';

const GroupsList = ({ group }) => {
  const {
    setMessageId,
    setSelectedFriend,
    setSelectedGroup,
    setIsChatOpen,
    userData,
  } = useContext(AppContext);

  const openGroupChat = useCallback(
    async (group) => {
      try {
        const chatId = group.id;
        const chatRef = doc(db, 'groups', chatId);
        const messagesRef = collection(chatRef, 'messages');

        const messageSnap = await getDocs(messagesRef);

       const updatePromises = messageSnap.docs.map((docSnap) => {
  const { messageSeen } = docSnap.data();

  if (!Array.isArray(messageSeen) || !messageSeen.includes(userData.id)) {
    return updateDoc(docSnap.ref, {
      messageSeen: arrayUnion(userData.id),
    });
  }
  return null;
});


        await Promise.all(updatePromises.filter(Boolean));

        setSelectedFriend(null);
        setSelectedGroup(group);
        setIsChatOpen(true);
        setMessageId(chatId);
      } catch (error) {
        console.error('Error opening group chat:', error);
      }
    },
    [userData.id, setSelectedFriend, setSelectedGroup, setIsChatOpen, setMessageId]
  );

  return (
    <div>
      {group.map((grp) => (
        <div
          key={grp.id}
          className="flex items-center gap-3 px-5 py-2 cursor-pointer"
          onClick={() => openGroupChat(grp)}
        >
          <img
            className="rounded-full w-9 aspect-square"
            src={grp.groupImage || assets.avatar_icon}
            alt={grp.groupName}
          />
          <div>
            <p className="font-semibold">{grp.groupName}</p>
            <p className="overflow-hidden text-xs truncate max-w-48">
              {grp.lastMessage}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupsList;
