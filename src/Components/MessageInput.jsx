import React, { useState, useRef, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { db } from '../config/firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import upload from '../storage/upload';
import assets from '../assets/assets';

const MessageInput = ({ input, setInput }) => {
  const inputRef = useRef(null);
  const { userData, selectedFriend, selectedGroup } = useContext(AppContext);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    const trimmedText = input.trim();

    if (!trimmedText) {
      alert("Cannot send an empty message.");
      return;
    }

    if (trimmedText.length > 1000) {
      alert("Message too long (max 1000 characters).");
      return;
    }

    if (!selectedFriend && !selectedGroup) {
      alert("No valid chat or group selected.");
      return;
    }

    setIsSending(true);

    try {
      const newMessage = {
        text: trimmedText,
        senderId: userData.id,
        senderName: userData.username,
        senderAvatar: userData.avatar,
        timestamp: new Date(),
        messageSeen: false,
      };

      const chatDocRef = selectedGroup
        ? doc(db, 'groups', selectedGroup.id)
        : doc(db, 'chats', [userData.id, selectedFriend.friend.id].sort().join('_'));

      await addDoc(collection(chatDocRef, 'messages'), newMessage);

      await updateDoc(chatDocRef, {
        lastMessage: trimmedText,
        lastMessageSender: userData.username,
        lastMessageAvatar: userData.avatar,
        updatedAt: serverTimestamp(),
        messageSeen: false, // optional: see note in analysis
      });

      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const sendFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type?.split('/')?.[0] || 'unknown';

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("File too large (max 10MB).");
      return;
    }

    const allowedTypes = ['image', 'video', 'application'];
    if (!allowedTypes.includes(fileType)) {
      alert("Unsupported file type.");
      return;
    }

    try {
      setIsSending(true);
      const fileUrl = await upload(file);

      const newMessage = {
        senderId: userData.id,
        senderName: userData.username,
        senderAvatar: userData.avatar,
        timestamp: serverTimestamp(),
        messageSeen: false,
        fileName: file.name,
      };

      if (fileType === 'image') newMessage.image = fileUrl;
      else if (fileType === 'video') newMessage.video = fileUrl;
      else newMessage.document = fileUrl;

      const chatDocRef = selectedGroup
        ? doc(db, 'groups', selectedGroup.id)
        : doc(db, 'chats', [userData.id, selectedFriend.friend.id].sort().join('_'));

      await addDoc(collection(chatDocRef, 'messages'), newMessage);

      await updateDoc(chatDocRef, {
        lastMessage: fileType === 'image' ? 'Image' : fileType === 'video' ? 'Video' : 'Document',
        lastMessageSender: userData.username,
        lastMessageAvatar: userData.avatar,
        updatedAt: serverTimestamp(),
      });

      setInput('');
    } catch (error) {
      console.error('Error sending file:', error);
      alert("Failed to upload file.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className='box-border bottom-0 flex w-full gap-4 py-3 bg-white'>
      <input
        ref={inputRef}
        className='flex-1 px-4 bg-transparent outline-none text-customBlack placeholder:text-textColor'
        onChange={(e) => setInput(e.target.value)}
        value={input}
        type="text"
        placeholder='Type a message'
        disabled={isSending}
      />
      <input
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.xlsx,.ppt,.pptx"
        id="fileInput"
        hidden
        onChange={sendFile}
        disabled={isSending}
      />
      <label htmlFor="fileInput">
        <img className='w-6 cursor-pointer' src={assets.gallery_icon} alt="Gallery Icon" />
      </label>
      <img
        className='mr-2 cursor-pointer w-7'
        src={assets.send_button}
        onClick={sendMessage}
        alt="Send Button"
      />
    </div>
  );
};

export default MessageInput;
