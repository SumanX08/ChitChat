const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.scheduleMessage = functions.pubsub.schedule("every 24 hours")
    .onRun(async (context) => {
      try {
        const scheduledMessagesRef = db.collection("scheduledMessages");
        const snapshot = await scheduledMessagesRef
            .where("sendTime", "<=", admin.firestore.Timestamp.now())
            .get();

        if (snapshot.empty) {
          console.log("No scheduled messages to send");
          return;
        }

        snapshot.forEach(async (doc) => {
          const messageData = doc.data();
          const {message, chatId, senderId} = messageData;

          // Send the message
          await db.collection("chats").doc(chatId).collection("messages").add({
            text: message,
            senderId: senderId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

          await doc.ref.delete();
          console.log(`Scheduled message for chat ${chatId} sent.`);
        });
      } catch (error) {
        console.error("Error processing scheduled messages:", error);
      }
    });
