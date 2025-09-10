import React, { useContext, useState } from 'react';
import { collection, setDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import assets from '../assets/assets';
import upload from '../storage/upload';
import { AppContext } from '../context/AppContext';

const CreateGroup = ({ onClose, friends, fetchGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [prevImage, setPrevImage] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { userData } = useContext(AppContext);
  const currentUser = userData.id;

  const handleCreateGroup = async () => {
    if (!groupName || selectedMembers.length === 0) {
      alert('Please enter a group name and select at least one member.');
      return;
    }

    setUploading(true);
    const groupDocRef = doc(collection(db, 'groups'));

    const groupInfo = {
      groupName,
      members: [...selectedMembers, currentUser],
      lastMessage: '',
      updatedAt: serverTimestamp(),
      groupImage: '', 
      description,
      createdBy: currentUser,
    };

    try {
      await setDoc(groupDocRef, groupInfo);
      await setDoc(doc(collection(groupDocRef, 'messages')), { initialized: true });

      if (image) {
        upload(image)
          .then(async (url) => {
            await updateDoc(groupDocRef, { groupImage: url });
            setPrevImage(url);
          })
          .catch((err) => {
            console.error('Error uploading group image:', err);
          });
      }

      alert('Group created successfully!');
      onClose(); 
      fetchGroup(); 
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Error creating group. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='flex flex-col p-5 bg-white rounded-xl w-96'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold text-customBlack'>New Group</h2>
          <img className='w-4 h-5 cursor-pointer' src={assets.cross_icon} onClick={onClose} alt="Close" />
        </div>

        <div className='flex items-center justify-around mt-4'>
          <input
            onChange={(e) => setImage(e.target.files[0])}
            type="file"
            id='avatar'
            accept='.png, .jpg, .jpeg, .webp'
            hidden
          />
          <label htmlFor='avatar'>
            <img
              className='w-12 rounded-full cursor-pointer aspect-square lg:w-14'
              src={image ? URL.createObjectURL(image) : prevImage || assets.avatar_icon}
              alt="Group Avatar"
            />
          </label>
          <input
            className='p-2 my-4 text-black border-2 border-gray-300 rounded'
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <input
          type="text"
          className='p-2 my-4 text-black border-2 border-gray-300 rounded'
          placeholder='Add description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <h3 className='mb-2 text-lg text-customBlack'>Select Members</h3>
        <div className='flex flex-col gap-4 overflow-y-auto max-h-52'>
          {friends.map((friend) => (
            <div className='flex items-center gap-2' key={friend.friend.id}>
              <img
                className='rounded-full w-9 aspect-square'
                src={friend.friend.avatar}
                alt={friend.friend.username}
              />
              <p className='flex-1 text-black'>{friend.friend.username}</p>
              <input
                type="checkbox"
                checked={selectedMembers.includes(friend.friend.id)}
                onChange={() => {
                  setSelectedMembers((prev) =>
                    prev.includes(friend.friend.id)
                      ? prev.filter((f) => f !== friend.friend.id)
                      : [...prev, friend.friend.id]
                  );
                }}
              />
            </div>
          ))}
        </div>

        <div className='flex justify-center mt-4'>
          <button
            className='p-2 text-center text-white rounded bg-customBlue'
            onClick={handleCreateGroup}
            disabled={uploading}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;
