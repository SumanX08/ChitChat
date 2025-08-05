import React, { useContext, useState, useEffect } from 'react';
import assets from '../assets/assets';
import { collection, query, where, getDocs, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';
import FriendsList from './FriendList';
import GroupsList from './GroupList';
import ShowMenu from './ShowMenu';

const Chats = () => {
  const [users, setUsers] = useState([]);
  const { userData, friends, setFriends, isChatOpen, group, setGroup } = useContext(AppContext);
  const [activeSection, setActiveSection] = useState('friends');

  useEffect(() => {
    if (!userData?.id) return;
    fetchFriends();
    setupGroupListener();
  }, [userData?.id]);

  const inputHandler = async (e) => {
    const input = e.target.value.trim();
    if (!input) return setUsers([]);

    try {
      const userRef = collection(db, 'users');
      const q = query(
        userRef,
        where('username', '>=', input.toLowerCase()),
        where('username', '<=', input.toLowerCase() + '\uf8ff')
      );
      const querySnap = await getDocs(q);
      const foundUsers = querySnap.docs.map((docSnap) => docSnap.data());

      const friendIds = friends.map((friend) => friend.id);
      const filteredUsers = foundUsers.filter(
        (user) => user.id !== userData.id && !friendIds.includes(user.id)
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const sendRequest = async (userData, ToUser) => {
    try {
      const requestsRef = collection(db, 'request');

      const existingRequestQuery = query(
        requestsRef,
        where('status', '==', 'pending'),
        where('from', 'in', [userData.id, ToUser.id]),
        where('to', 'in', [userData.id, ToUser.id])
      );

      const existingRequestSnap = await getDocs(existingRequestQuery);
      if (!existingRequestSnap.empty) {
        const existingRequest = existingRequestSnap.docs[0].data();
        if (existingRequest.from === ToUser.id) {
          toast.info('There is already a pending request from this user.');
        } else {
          toast.info('You have already sent a request.');
        }
        return;
      }

      await addDoc(requestsRef, {
        from: userData.id,
        sendername: userData.username,
        to: ToUser.id,
        recievername: ToUser.username,
        status: 'pending',
        avatar: userData.avatar,
      });

      toast.success('Friend request sent!');
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error('Error sending request. Please try again.');
    }
  };

  const setupGroupListener = () => {
    if (!userData?.id) return;

    const groupsRef = collection(db, 'groups');
    const groupsQuery = query(groupsRef, where('members', 'array-contains', userData.id));

    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      const groupsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setGroup(groupsList);
    }, (error) => {
      console.error("Error in group snapshot listener:", error);
    });

    return unsubscribe;
  };

  const fetchFriends = async () => {
    if (!userData?.id) return;

    try {
      const friendsRef = collection(db, 'friends');
      const q1 = query(friendsRef, where('userId', '==', userData.id), where('status', '==', 'accepted'));
      const q2 = query(friendsRef, where('friendsId', '==', userData.id), where('status', '==', 'accepted'));

      const [querySnap1, querySnap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const friendsData = [...querySnap1.docs, ...querySnap2.docs].map(doc => doc.data());

      const userIds = [...new Set(friendsData.flatMap(friend =>
        [friend.userId, friend.friendsId].filter(id => id !== userData.id)
      ))];

      const chunkSize = 10;
      const userChunks = Array.from({ length: Math.ceil(userIds.length / chunkSize) }, (_, i) =>
        userIds.slice(i * chunkSize, i * chunkSize + chunkSize)
      );

      const userSnapshots = await Promise.all(userChunks.map(chunk => {
        const userRef = collection(db, 'users');
        return getDocs(query(userRef, where('__name__', 'in', chunk)));
      }));

      const usersList = userSnapshots.flatMap(snapshot => snapshot.docs.map(doc => doc.data()));

      const updatedFriends = friendsData.map(friend => {
        const friendUser = usersList.find(u =>
          u.id === friend.userId || u.id === friend.friendsId
        ) || { id: friend.friendsId, username: 'Unknown', avatar: assets.avatar_icon };

        const chatId = [userData.id, friendUser.id].sort().join('_');
        const chatRef = collection(db, 'chats');

        let lastMessage = 'No messages yet';
        let isUnread = false;

        onSnapshot(
          query(chatRef, where('chatId', '==', chatId)),
          (chatSnap) => {
            if (!chatSnap.empty) {
              const chatData = chatSnap.docs[0].data();
              lastMessage = chatData?.lastMessage || 'No messages yet';
              isUnread = chatData?.messageSeen === false;

              setFriends(prev =>
                prev.map(f => f.friend.id === friendUser.id ? { ...f, lastMessage, isUnread } : f)
              );
            }
          }
        );

        return { ...friend, friend: friendUser, lastMessage, isUnread };
      });

      setFriends(updatedFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  return (
    <div className={`w-full text-white bg-black h-75vh lg:block ${isChatOpen ? "hidden" : "block"} lg:w-auto`}>
      <div className='p-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-1'>
              <img className='w-10' src={assets.logo_icon} alt='' />
              <p className='text-xl'>ChitChat</p>
          </div>
          <ShowMenu fetchGroup={setupGroupListener} fetchFriends={fetchFriends} />
        </div>

        <div className='flex items-center gap-3 px-3 py-2 mt-5 bg-customGrey'>
          <img className='w-4' src={assets.search_icon} alt='' />
          <input onChange={inputHandler} className='bg-transparent outline-none' type='text' placeholder='Search' />
        </div>
      </div>

      <div className='flex justify-around'>
        <p
          className={`cursor-pointer ${activeSection === 'friends' ? 'border-b-2 border-white' : ''}`}
          onClick={() => setActiveSection('friends')}
        >
          Friends
        </p>
        <p
          className={`cursor-pointer ${activeSection === 'groups' ? 'border-b-2 border-white' : ''}`}
          onClick={() => setActiveSection('groups')}
        >
          Groups
        </p>
      </div>

      <div className='flex flex-col mt-2 h-3/4'>
        {users.length > 0 ? (
          users.map((user) => (
            <div key={user.id} className='flex items-center justify-between'>
              <div className='flex items-center gap-3 px-5 py-2 cursor-pointer'>
                <img className='rounded-full w-9 aspect-square' src={user.avatar || assets.avatar_icon} alt='avatar' />
                <p className='text-lg font-medium'>{user.username}</p>
              </div>
              <img className='w-16 px-4 cursor-pointer' onClick={() => sendRequest(userData, user)} src={assets.add_icon} alt='add' />
            </div>
          ))
        ) : activeSection === 'friends' ? (
          <FriendsList />
        ) : (
          <GroupsList group={group} />
        )}
      </div>
    </div>
  );
};

export default Chats;
