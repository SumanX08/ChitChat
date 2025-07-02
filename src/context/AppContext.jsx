import { createContext, useEffect, useState ,useCallback} from "react";
import { doc, getDoc, updateDoc, serverTimestamp, } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { use } from "react";
import { onAuthStateChanged } from "firebase/auth";
export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  // State variables
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [messageId, setMessageId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState();
  const [friends, setFriends] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false); // State to toggle views
  const [group, setGroup] = useState([]);
  const [membersInfo,setMembersInfo]=useState()
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isInfoOpen,setIsInfoOpen]=useState(false)
  const [lastSeenIntervalId, setLastSeenIntervalId] = useState(null); // NEW


  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      await loadUserData(user.uid);
    } else {
      setUserData(null);
    }
    setIsAuthLoading(false);
  });

  return unsubscribe;
}, []);

  const loadGroupUsers = useCallback(async (members = []) => {
  if (!auth.currentUser) return;
  if (!Array.isArray(members) || members.length === 0) return;

  try {
    const userDocs = await Promise.all(
      members.map(async (userId) => {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        return userSnap.exists() ? { id: userId, ...userSnap.data() } : null;
      })
    );
    setMembersInfo(userDocs.filter(user => user !== null));
  } catch (error) {
    console.error("Error fetching group members' data:", error);
  }
}, []);

  

 const loadUserData = async (uid) => {
  try {
    if (!uid) return; // ✅ now correctly checking for uid

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      setUserData(userData);

      // Navigate based on profile completion
      if (userData.avatar && userData.name && userData.bio) {
        navigate("/chat");
      } else {
        navigate("/updateProfile");
      }

      // Initial `lastSeen` update
      await updateDoc(userRef, { lastSeen: serverTimestamp() });

      // Update `lastSeen` every 30 seconds
      const intervalId = setInterval(() => {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === uid) {
          updateDoc(userRef, { lastSeen: serverTimestamp() });
        }
      }, 30000);

      setLastSeenIntervalId(intervalId);
    } else {
      console.error("User document not found");
    }
  } catch (error) {
    console.error("Error loading user data or updating lastSeen:", error);
  }
};


  useEffect(() => {
  return () => {
    if (lastSeenIntervalId) clearInterval(lastSeenIntervalId);
  };
}, [lastSeenIntervalId]);

  const value = {
    userData,
    setUserData,
    chatData,
    setChatData,
    loadUserData,
    messageId,
    setMessageId,
    messages,
    setMessages,
    chatUser,
    setChatUser,
    selectedFriend,
    setSelectedFriend,
    selectedGroup,
    setSelectedGroup,
    friends,
    setFriends,
    isChatOpen,
    setIsChatOpen,
    group,
    setGroup,
    isInfoOpen,
    setIsInfoOpen,
    loadGroupUsers,
    membersInfo,
    setMembersInfo
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
