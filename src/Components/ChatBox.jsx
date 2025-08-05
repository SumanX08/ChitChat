import React, { useContext, useEffect, useState, useRef } from 'react';
import assets from '../assets/assets';
import { AppContext } from '../context/AppContext';
import { doc, onSnapshot, collection, arrayUnion, updateDoc, addDoc, getDoc,getDocs ,writeBatch} from 'firebase/firestore';
import { db } from '../config/firebase';
import MessageInput from './MessageInput';
import Messages from './Messages';
import upload from '../storage/upload';

const ChatBox = ({  isFriendOnline, setIsFriendOnline, }) => {
  const { userData, messageId, setMessages, friends ,selectedFriend,selectedGroup,setIsChatOpen,isChatOpen,isInfoOpen,setIsInfoOpen } = useContext(AppContext);

  const [menuVisible, setMenuVisible] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduledText, setScheduledText] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [groupMembers, setGroupMembers] = useState([]); // State to hold selectedFriend member usernames
      const [input, setInput] = useState('');
  
  





  // Fetch selectedFriend members' usernames when the selectedFriend is available
  useEffect(() => {
    if (selectedFriend && selectedFriend.members) {
      
      const fetchGroupMembers = async () => {
  try {
    const memberIds = selectedFriend?.members || [];
    if (memberIds.length === 0) return;

    const usersRef = collection(db, "users");
    const memberDocs = await getDocs(usersRef); 

    const members = [];

    memberDocs.forEach((docSnap) => {
      const data = docSnap.data();
      if (memberIds.includes(data.id)) { 
        members.push({
          username: data.username,
          avatar: data.avatar,
          id: data.id,
        });
      }
    });

    setGroupMembers(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
  }
};


      fetchGroupMembers();
    }
  }, [selectedFriend]);



  // Check and set the friend's online status
  useEffect(() => {
    if (selectedFriend && selectedFriend.friend.id) {
      const friendDocRef = doc(db, 'users', selectedFriend.friend.id);
      const unsubscribe = onSnapshot(friendDocRef, (doc) => {
        if (doc.exists()) {
          const friendData = doc.data();
          const lastSeen = friendData.lastSeen?.toDate();
          const currentTime = Date.now();

          if (lastSeen) {
            const timeDifference = currentTime - lastSeen.getTime();
            const onlineStatus = timeDifference < 30000; 
            setIsFriendOnline(onlineStatus);
          }
        }
      });

      return () => unsubscribe();
    }
  }, [selectedFriend, setIsFriendOnline]);

  
  const clearChat = async () => {
  const chatId = [userData.id, selectedFriend?.friend.id].sort().join("_");

  if (selectedGroup?.id || chatId) {
    try {
      const chatDocRef = selectedGroup?.id
        ? doc(db, "groups", selectedGroup.id)
        : doc(db, "chats", chatId);

      const messagesRef = collection(chatDocRef, "messages");
      const querySnapshot = await getDocs(messagesRef);

      const userId = userData.id;
      const batch = writeBatch(db); 

      querySnapshot.forEach((messageDoc) => {
        const messageRef = messageDoc.ref;
        batch.update(messageRef, {
          deletedFor: arrayUnion(userId),
        });
      });

      await batch.commit(); 
      setMessages([]); 
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  } else {
    console.error("Error: selectedGroup.id or chatId is undefined.");
  }
};
  
  // Toggle menu visibility
  const toggleMenu = () => {
    setMenuVisible((prev) => !prev);
  };


  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menuElement = document.querySelector('.menu');
      if (menuVisible && menuElement && !menuElement.contains(event.target)) {
        setMenuVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuVisible]);

const handleScheduleMessage = async () => {
  try {
    const trimmedText = scheduledText.trim();

    if (!trimmedText) {
      alert("Message cannot be empty.");
      return;
    }

    if (trimmedText.length > 1000) {
      alert("Message is too long. Limit to 1000 characters.");
      return;
    }

    const scheduledDate = new Date(scheduledTime);
    const currentTime = Date.now();

    if (isNaN(scheduledDate.getTime())) {
      alert("Invalid date and time format.");
      return;
    }

    if (scheduledDate.getTime() <= currentTime + 30000) {
      alert("Scheduled time must be at least 30 seconds in the future.");
      return;
    }

    const chatId = [userData.id, selectedFriend?.friend.id].sort().join('_');
    let collectionRef;

    if (selectedGroup?.id) {
      collectionRef = collection(db, 'groups', selectedGroup.id, 'scheduledMessages');
    } else if (selectedFriend?.friend?.id) {
      collectionRef = collection(db, 'chats', chatId, 'scheduledMessages');
    } else {
      alert("Could not determine chat target.");
      return;
    }

    await addDoc(collectionRef, {
      text: trimmedText,
      senderId: userData.id,
      timestamp: new Date(),
      scheduledTime: scheduledDate,
      scheduled: true,
    });

    // Reset modal and input
    setScheduleModal(false);
    setScheduledText('');
    setScheduledTime('');
  } catch (error) {
    console.error("Error scheduling message:", error);
    alert("Failed to schedule the message. Please try again.");
  }
};

  
  
  

  if ( !selectedFriend&&!selectedGroup) {
    return (
      <div className="items-center justify-center hidden w-full overflow-y-scroll bg-gray-200 lg:inline-flex">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
<div className={`w-full overflow-y-scroll h-75vh scrollbar-hide bg-gray-200 lg:block ${isChatOpen && !isInfoOpen ? "block" : "hidden"}`}>
  {/* Header Section */}
  <div className="relative flex items-center gap-3 px-3 py-2 bg-white border-b-2">
    {/* Back Icon */}
    <div onClick={() => setIsChatOpen(false)} className="w-8 -mx-3 cursor-pointer">
      <img className="lg:hidden" src={assets.Back_icon} alt="Back Icon" />
    </div>

    {/* Avatar */}
    <img
      className="rounded-full w-9 aspect-square"
      src={selectedFriend ? selectedFriend.friend.avatar : selectedGroup.groupImage}
      alt="Avatar"
    />

    {/* Chat Title */}
    <p className="flex items-center flex-1 gap-1 text-xl font-medium text-center">
      {selectedFriend ? selectedFriend.friend.username : selectedGroup.groupName}
      <img src={selectedFriend && isFriendOnline ? assets.green_dot : ""} alt="" />
    </p>

    {/* Help and Menu Icons */}
    <img
      src={assets.help_icon}
      onClick={() => {
        setIsInfoOpen(true);
        console.log(isInfoOpen);
      }}
      className={`w-6 cursor-pointer lg:hidden ${isChatOpen ? "block" : "hidden"}`}
      alt="Help Icon"
    />
    <img
      onClick={toggleMenu}
      className="w-6 cursor-pointer"
      src={assets.Bmenu_icon}
      alt="Menu Icon"
    />

    {/* Dropdown Menu */}
    {menuVisible && (
      <div
        className="absolute right-0 z-50 mt-2 text-sm bg-white border rounded shadow-lg top-full menu"
        
      >
        <button
          onClick={() => clearChat()}
          className="block w-full px-4 py-2 font-semibold text-center text-customBlue hover:bg-gray-200"
        >
          Clear Chat
        </button>
        <hr />
        <button
          onClick={() => setScheduleModal(true)}
          className="block w-full px-4 py-2 font-semibold text-left text-customBlue hover:bg-gray-200"
        >
          Schedule Message
        </button>
      </div>
    )}
  </div>

  {/* Schedule Modal */}
  {scheduleModal && (
    <div className="inset-0 items-center justify-center block bg-black bg-opacity-50 modal">
      <div className="p-6 bg-white rounded shadow-lg">
        <h2 className="mb-4 text-lg font-medium">Schedule Message</h2>
        <input
          type="text"
          className="w-full px-4 py-2 mb-3 border rounded"
          placeholder="Enter message"
          value={scheduledText}
          onChange={(e) => setScheduledText(e.target.value)}
        />
        <input
          type="datetime-local"
          className="w-full px-4 py-2 mb-3 border rounded"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={handleScheduleMessage}
            className="px-4 py-2 text-white bg-blue-500 rounded"
          >
            Schedule
          </button>
          <button
            onClick={() => setScheduleModal(false)}
            className="px-4 py-2 text-white bg-gray-500 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Messages Section */}
  <Messages selectedFriend={selectedFriend} messageId={messageId} />
  <MessageInput input={input} setInput={setInput} />
</div>

  );
};

export default ChatBox;
