const {messaging} = require("../service/firebase");
class PushNotification {
  /*
   * Prepare push notification payload
   */
  async notifySingleDevice(notificationObj, token, otherData) {
    console.log("notificationObj=>", notificationObj);

    console.log("otherData=>", otherData);
    const payload = {
      token: token,
      notification: {
        title: notificationObj.title,
        body: notificationObj.body,
      },
      data: { ...otherData },
    };
    messaging
      .send({
        ...payload,
        apns: {
          payload: {
            aps: {
              alert: {
                title: notificationObj.title,
                body: notificationObj.body,
              },
            },
          },
        },
      })
      .then((response) => {
        // Response is a message ID string.
        console.log("Successfully sent message:", response);
        return response;
      })
      .catch((error) => {
        console.log("Error sending message:", error.message);
      });
  }

  async notifyMultipleDevices(notificationObj, tokens, otherData) {
    const payload = {
      tokens: tokens,
      notification: {
        title: notificationObj.title,
        body: notificationObj.body,
        // icon: "https://petznpetz.s3.us-east-2.amazonaws.com/appassest/mazito_app_icon.png"
      },
      data: otherData,
    };

    messaging
      .sendMulticast({
        ...payload,
        apns: {
          payload: {
            aps: {
              alert: {
                title: notificationObj.title,
                body: notificationObj.body,
              },
            },
          },
        },
      })
      .then((response) => {
        // Response is a message ID string.
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  }

  /*
   * Send push notification to user
   */
  async notifyAllDevices(notificationObj, otherData) {
    const messages = [];
    messages.push({
      notification: {
        title: "Price drop",
        body: "5% off all electronics",
      },
      token: registrationToken,
    });
    messages.push({
      notification: { title: "Price drop", body: "2% off all books" },
      topic: "readers-club",
    });

    messaging.sendAll(messages).then((response) => {
      console.log(response.successCount + " messages were sent successfully");
    });
  }
}

// Bind the context of the class with it before exporting.
PushNotification.bind(PushNotification);

module.exports = new PushNotification();
