import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import assets from '../assets/assets';
import DeleteOptions from './DeleteOptions';
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const Messages = () => {
  const [showDeleteOptions, setShowDeleteOptions] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [allMessages, setAllMessages] = useState(new Map()); // ← internal source of truth

  const {
    messages,
    userData,
    setMessages,
    selectedFriend,
    selectedGroup,
  } = useContext(AppContext);

  const isGroup = Boolean(selectedGroup);

  const chatId = useMemo(() => {
    if (isGroup) return selectedGroup?.id;
    if (userData?.id && selectedFriend?.friend?.id) {
      return [userData.id, selectedFriend.friend.id].sort().join('_');
    }
    return null;
  }, [isGroup, userData?.id, selectedFriend]);

  const chatPath = useMemo(() => {
    return chatId ? collection(db, isGroup ? 'groups' : 'chats', chatId, 'messages') : null;
  }, [chatId, isGroup]);

  const scheduledPath = useMemo(() => {
    return chatId ? collection(db, isGroup ? 'groups' : 'chats', chatId, 'scheduledMessages') : null;
  }, [chatId, isGroup]);

  const fieldToCheck = isGroup ? 'deletedFor' : 'deletedBy';

  const deleteMessage = async (msgId) => {
    try {
      const docPath = doc(db, isGroup ? 'groups' : 'chats', chatId, 'messages', msgId);
      await updateDoc(docPath, {
        [fieldToCheck]: arrayUnion(userData.id),
      });

      setAllMessages(prev => {
        const updated = new Map(prev);
        const msg = updated.get(msgId);
        if (msg) {
          msg[fieldToCheck] = [...(msg[fieldToCheck] || []), userData.id];
          updated.set(msgId, msg);
        }
        return updated;
      });

      setShowDeleteOptions(false);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const deleteMessageForEveryone = async (msgId) => {
    try {
      const docPath = doc(db, isGroup ? 'groups' : 'chats', chatId, 'messages', msgId);
      await updateDoc(docPath, {
        text: 'This message was deleted',
        isDeleted: true,
        deletedBy: [],
        deletedFor: [],
      });

      setAllMessages(prev => {
        const updated = new Map(prev);
        const msg = updated.get(msgId);
        if (msg) {
          msg.text = 'This message was deleted';
          msg.isDeleted = true;
          msg.deletedBy = [];
          msg.deletedFor = [];
          updated.set(msgId, msg);
        }
        return updated;
      });

      setShowDeleteOptions(false);
    } catch (err) {
      console.error('Error deleting message for everyone:', err);
    }
  };

  useEffect(() => {
    if (!chatPath || !userData?.id) return;

    const unsubscribe = onSnapshot(query(chatPath, orderBy('timestamp', 'asc')), (snapshot) => {
      const currentTime = Date.now();
      const updates = new Map();

      snapshot.forEach((doc) => {
        const msg = { id: doc.id, ...doc.data() };
        const isDeletedForMe = msg[fieldToCheck]?.includes(userData.id);
        const isScheduled = msg.scheduled && msg.scheduledTime?.toMillis() > currentTime;

        if (!isScheduled && (!isDeletedForMe || msg.isDeleted)) {
          updates.set(msg.id, msg);
        }
      });

      setAllMessages((prev) => {
        const newMap = new Map(prev);
        updates.forEach((msg, id) => newMap.set(id, msg));
        return newMap;
      });
    });

    return () => unsubscribe();
  }, [chatPath, userData?.id]);

  useEffect(() => {
    if (!scheduledPath || !userData?.id) return;

    const unsubscribe = onSnapshot(query(scheduledPath, orderBy('timestamp', 'asc')), (snapshot) => {
      const currentTime = Date.now();
      const updates = new Map();

      snapshot.forEach((doc) => {
        const msg = { id: doc.id, ...doc.data() };
        const shouldShow = msg.scheduledTime?.toMillis() <= currentTime;

        if (shouldShow) {
          updates.set(msg.id, { ...msg, timestamp: msg.scheduledTime }); // Use scheduled time for display
        }
      });

      setAllMessages((prev) => {
        const newMap = new Map(prev);
        updates.forEach((msg, id) => newMap.set(id, msg));
        return newMap;
      });
    });

    return () => unsubscribe();
  }, [scheduledPath, userData?.id, now]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const all = Array.from(allMessages.values());
    const sorted = all.sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || 0;
      const bTime = b.timestamp?.toMillis?.() || 0;
      return bTime - aTime;
    });
    setMessages(sorted);
  }, [allMessages]);

  return (
    <div className="h-[calc(100%-106px)] scrollbar-hide flex flex-col-reverse gap-2 overflow-scroll">
      {messages.map((msg) => {
        const isCurrentUser = msg.senderId === userData.id;
        const showOptions = showDeleteOptions === msg.id;

        return (
          <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} gap-2 items-center relative`}>
            {!isCurrentUser && isGroup && (
              <img className="rounded-full w-9 aspect-square" src={msg.senderAvatar} alt="Sender Avatar" />
            )}
            <div className={`flex items-center ${isCurrentUser ? 'flex-row-reverse mr-4' : 'ml-4'} gap-2`}>
              <div className={`px-2 text-white bg-customBlue ${isCurrentUser ? 'rounded-lg rounded-br-none py-2' : 'py-1 rounded-lg rounded-bl-none'} break-words`}>
                {msg.isDeleted ? (
                  <p className="text-sm leading-tight text-white">This message was deleted</p>
                ) : (
                  <>
                    {msg.image && <img className="max-w-[200px] rounded-lg" src={msg.image} alt="Image" />}
                    {msg.video && <video className="max-w-[200px]" controls src={msg.video}></video>}
                    {msg.document && (
                      <a href={msg.document} target="_blank" rel="noopener noreferrer" className="underline text-customBlack">
                        {msg.fileName}
                      </a>
                    )}
                    <p className="text-sm leading-tight">{msg.text}</p>
                  </>
                )}
                <p className="text-xs text-right text-gray-300">
                  {new Date(msg.timestamp?.toDate?.()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }).toUpperCase()}
                </p>
              </div>
              <button onClick={() => setShowDeleteOptions(msg.id)} className="flex-shrink-0">
                <img className="h-4" src={assets.bin_icon} alt="Delete" />
              </button>
            </div>

            {showOptions && selectedFriend && (
              <div className="absolute z-10 flex flex-col transform -translate-x-1/2 -translate-y-1/2 bg-white border rounded shadow-lg top-1/2 left-1/2">
                <button className="px-2 py-1 text-xs text-customBlue" onClick={() => deleteMessage(msg.id)}>
                  Delete for Me
                </button>
                {!msg.isDeleted && isCurrentUser && (
                  <button className="px-2 py-1 text-xs text-customBlue" onClick={() => deleteMessageForEveryone(msg.id)}>
                    Delete for Everyone
                  </button>
                )}
              </div>
            )}

            {showOptions && isGroup && (
              <DeleteOptions
                onClose={() => setShowDeleteOptions(false)}
                groupMembers={selectedGroup.members || []}
                deleteMessage={deleteMessage}
                deleteMessageForEveryone={deleteMessageForEveryone}
                messageId={msg.id}
                groupId={selectedGroup.id}
                setShowDeleteOptions={setShowDeleteOptions}
                senderId={msg.senderId}
                group={selectedGroup}
                messages={messages}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Messages;
