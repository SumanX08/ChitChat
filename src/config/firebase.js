import { initializeApp } from "firebase/app";
import {createUserWithEmailAndPassword,getAuth,signInWithEmailAndPassword,signOut,fetchSignInMethodsForEmail,sendPasswordResetEmail} from "firebase/auth";
import {getFirestore,setDoc,doc,updateDoc,getDoc,collection,query,where,getDocs,} from "firebase/firestore";
import { toast } from "react-toastify";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4ErQp1x2Qt2VrFgbnMdFhFxjTbejZ9S4",
  authDomain: "chat-app-45516.firebaseapp.com",
  projectId: "chat-app-45516",
  storageBucket: "chat-app-45516.appspot.com",
  messagingSenderId: "1024635293694",
  appId: "1:1024635293694:web:a578f73c423dbaae36faaf",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Sign up a new user
 */
const signup = async (username, email, password) => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    // Create user document
    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      username: username.toLowerCase(),
      email,
      name: "",
      avatar: "",
      bio: "Hey, how are you?",
    });

    // Create chat document
    await setDoc(doc(db, "chats", user.uid), {
      chatData: [],
    });

  // Sign out the user
    toast.success("Sign up successful! Please log in.");
  } catch (error) {
    console.error("Signup Error:", error);
    toast.error(error.message || "An error occurred during signup.");
  }
};

/**
 * Log in a user
 */
const login = async (email, password, loadUserData, navigate) => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    toast.success("Logged in successfully!");

    if (loadUserData) {
      await loadUserData(res.user.uid); // ✅ Update AppContext
    }

    if (navigate) {
      navigate("/chat"); // ✅ Redirect to /chat
    }
  } catch (error) {
    console.error("Login Error:", error);
    toast.error(error.message || "An error occurred during login.");
  }
};


/**
 * Log out the current user
 */
const logout = async () => {
  try {
    await signOut(auth);
    toast.success("Logged out successfully!");
  } catch (error) {
    console.error("Logout Error:", error);
    toast.error(error.message || "An error occurred during logout.");
  }
};

/**
 * Update request status
 */
const requestHandler = async (requestId, status) => {
  try {
    const reqDoc = doc(db, "request", requestId);
    await updateDoc(reqDoc, { status });
    toast.success(`Request status updated to ${status}`);
  } catch (error) {
    console.error("Request Update Error:", error);
    toast.error("Failed to update request status.");
  }
};



/**
 * Accept a friend request
 */
const acceptRequest = async (requestId) => {
  try {
    const reqDoc = doc(db, "request", requestId);
    const reqSnap = await getDoc(reqDoc);

    if (!reqSnap.exists()) {
      toast.error("Request not found.");
      return;
    }

    const requestData = reqSnap.data();
    const { from: fromUserId, to: toUserId } = requestData;

    // Check if users are already friends
    const friendsQuery = query(
      collection(db, "friends"),
      where("status", "==", "accepted"),
      where("userId", "in", [fromUserId, toUserId]),
      where("friendsId", "in", [fromUserId, toUserId])
    );

    const friendsSnap = await getDocs(friendsQuery);

    if (!friendsSnap.empty) {
      toast.info("You are already friends with this user.");
      return;
    }

    // Update request status
    await updateDoc(reqDoc, { status: "accepted" });

    // Create friendship record
    await setDoc(doc(db, "friends", requestId), {
      userId: fromUserId,
      friendsId: toUserId,
      status: "accepted",
    });

    toast.success("Friend request accepted!");
  } catch (error) {
    console.error("Accept Request Error:", error);
    toast.error("Failed to accept the request.");
  }
};

const checkEmailExistence = async (email) => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0; // If methods length > 0, email exists
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false; // If error, assume email doesn't exist
  }
};


const resetPassword = async(email) => {
  if(!email){
    toast.error("Enter an email")
    return null
  }
  try{
    const userRef=collection(db,"users")
    const q =query(userRef,where("email","==",email))
    const querySnap= await getDocs(q)
    if(!querySnap.empty){
      await sendPasswordResetEmail(auth,email)
      toast.success("Reset Email Sent")
    }
    else{
      toast.error("Email doesn't exists")
    }
  }
  catch(error){

    console.error(error)
    toast.error(error)
  }

};
export { login, signup, logout, auth, db, requestHandler, acceptRequest ,checkEmailExistence,resetPassword};
