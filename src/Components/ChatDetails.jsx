import React, { useContext, useEffect, useState, useMemo } from 'react';
import assets from '../assets/assets';
import { logout } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import GroupInfo from './GroupInfo';

const ChatDetails = ({ friend, isFriendOnline }) => {
  const {
    messages,
    isInfoOpen,
    setIsInfoOpen,
    selectedGroup,
    selectedFriend
  } = useContext(AppContext);

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Images');
  const [groupInfo, setGroupInfo] = useState(false);

  
  const { images, videos, documents } = useMemo(() => {
    const imgs = [], vids = [], docs = [];

    messages.forEach((msg) => {
      if (msg.image) imgs.push(msg.image);
      else if (msg.video) vids.push(msg.video);
      else if (msg.document) {
        docs.push({
          url: msg.document,
          name: msg.fileName || 'Document',
        });
      }
    });

    return { images: imgs, videos: vids, documents: docs };
  }, [messages]);

  const renderActiveTabContent = useMemo(() => {
    const noItemsMsg = (msg) => (
      <p className='col-span-3 mt-4 text-sm text-center text-gray-400'>{msg}</p>
    );

    if (activeTab === 'Images') {
      return (
<div className='grid grid-cols-3 gap-1 px-4 mt-2 overflow-y-scroll scrollbar-hide max-h-56'>
          {images.length === 0
            ? noItemsMsg('No images shared.')
            : images.map((url, index) => (
                <img className='w-16 h-16 rounded cursor-pointer' src={url} key={index} alt="Shared" />
              ))}
        </div>
      );
    }
    

    if (activeTab === 'Videos') {
      return (
        <div className='grid grid-cols-3 gap-1 px-4 mt-2 overflow-y-scroll scrollbar-hide max-h-56'>
          {videos.length === 0
            ? noItemsMsg('No videos shared.')
            : videos.map((url, index) => (
                <video className='w-16 h-16 rounded cursor-pointer' controls src={url} key={index}></video>
              ))}
        </div>
      );
    }

    if (activeTab === 'Documents') {
      return (
        <div className='grid gap-1 px-4 mt-2 overflow-y-scroll scrollbar-hide max-h-56'>
          {documents.length === 0
            ? noItemsMsg('No documents shared.')
            : documents.map((doc, index) => (
                <a
                  href={doc.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='block w-full text-center text-blue-500 underline'
                  key={index}
                >
                  {doc.name}
                </a>
              ))}
        </div>
      );
    }

    return null;
  }, [activeTab, images, videos, documents]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  // Avoid conditional return before hooks
  const shouldRenderContent = !!friend || !!selectedGroup;

  return (
    <div className={`bg-customBlack h-75vh flex flex-col justify-between w-full lg:block ${isInfoOpen ? 'block' : 'hidden'}`}>

      {shouldRenderContent ? (
        <>
          <div>
            <img
              src={assets.arrow_icon}
              onClick={() => setIsInfoOpen(false)}
              className='absolute w-8 h-6 cursor-pointer top-5 left-2 lg:hidden'
              alt="Back"
            />
            {selectedGroup && (
              <img
                src={assets.Info_icon}
                onClick={() => setGroupInfo(true)}
                className='absolute w-6 cursor-pointer right-3 top-5'
                alt="Group Info"
              />
            )}
          </div>

          <div className='flex flex-col items-center justify-center pt-5 text-center'>
            <img
              className='w-28 aspect-square rounded-50%'
              src={selectedFriend?.friend?.avatar || selectedGroup?.groupImage || assets.default_avatar}
              alt="Profile"
            />
            <h3 className='flex items-center justify-center text-lg font-semibold text-white'>
              {selectedFriend?.friend?.username || selectedGroup?.groupName}
              {friend && isFriendOnline && <img src={assets.green_dot} alt="Online" />}
            </h3>
            <p className='text-sm text-white opacity-85'>
              {selectedFriend?.friend?.bio || selectedGroup?.description}
            </p>
          </div>

          <hr className='my-4' />

          <div className='flex justify-around'>
            {['Images', 'Videos', 'Documents'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-medium font-semibold ${
                  activeTab === tab ? 'border-b-2 border-customBlue text-white' : 'text-textColor'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {renderActiveTabContent}

             

          <GroupInfo groupInfo={groupInfo} setGroupInfo={setGroupInfo} />
        </>
      ) : (
        <></>
      )}
      <div className='flex justify-center my-4 '>
          <button
            className='w-4/5 h-12 text-lg font-semibold text-white rounded-3xl bg-customBlue'
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
    </div>
  );
};

export default ChatDetails;
