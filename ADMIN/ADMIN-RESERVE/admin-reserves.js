// Import the necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAz0s6YhO_x58A1CU8n6rp1jTrhMXDDAhY",
  authDomain: "bulldogs-exchange.firebaseapp.com",
  projectId: "bulldogs-exchange",
  storageBucket: "bulldogs-exchange.appspot.com",
  messagingSenderId: "756908205528",
  appId: "1:756908205528:web:da9563b3e3fc10f40ebead",
  measurementId: "G-Z2H16L9JKM",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

(function () {
  emailjs.init("QuEFIgYEQmS9nPY9-"); // Replace with your EmailJS user ID
})();

async function sendEmail(userEmail, itemData) {
  const templateParams = {
    to_email: userEmail,
    to_name: itemData.addedBy,
    item_title: itemData.title,
    item_price: itemData.price,
    item_image: itemData.imageUrl,
  };

  try {
    const result = await emailjs.send(
      "service_xk8d7cb", // Replace with your EmailJS service ID
      "template_j4xc3r7", // Replace with your EmailJS template ID
      templateParams
    );
    console.log("Email sent successfully:", result.status, result.text);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Function to fetch reserved items from Firestore
async function fetchReservedItems() {
  try {
    console.log("Fetching user IDs from Firestore...");
    const reservesCollection = collection(db, "Reserves");
    const reservesSnapshot = await getDocs(reservesCollection);

    const reservationList = document.querySelector(".reservation-list");
    reservationList.innerHTML = ""; // Clear previous content

    reservesSnapshot.forEach(async (reserveDoc) => {
      const userId = reserveDoc.id; // Get the userId from the document ID
      console.log("Fetching data for userId: ", userId);

      const cartCollection = collection(db, `Reserves/${userId}/Cart`);
      const cartSnapshot = await getDocs(cartCollection);

      cartSnapshot.forEach((doc) => {
        const itemData = doc.data();
        console.log("Fetched item data: ", itemData);

        // Create a new reservation item element
        const reservationItem = document.createElement("div");
        reservationItem.classList.add("reservation-item");

        reservationItem.innerHTML = `
          <img src="${itemData.imageUrl}" alt="${itemData.title}" />
          <div class="item-details">
            <h2>${itemData.title}</h2>
            <p>${itemData.userEmail}</p>
            <p class="price">${itemData.price}</p>
          </div>
          <button class="view-btn"
      data-email="${itemData.userEmail}"
      data-title="${itemData.title}"
      data-price="${itemData.price}"
      data-image="${itemData.imageUrl}"
      data-user="${itemData.addedBy}">
      Notify User
    </button>
        `;

        // Append the reservation item to the list
        reservationList.appendChild(reservationItem);

        // Attach the event listener to the newly created button
        const viewButton = reservationItem.querySelector(".view-btn");
        viewButton.addEventListener("click", (event) => {
          console.log("VIEW button clicked");
          const userEmail = event.target.getAttribute("data-email");
          const itemData = {
            addedBy: event.target.getAttribute("data-user"),
            title: event.target.getAttribute("data-title"),
            price: event.target.getAttribute("data-price"),
            imageUrl: event.target.getAttribute("data-image"),
          };

          // Call the sendEmail function when the "VIEW" button is clicked
          sendEmail(userEmail, itemData);
        });
      });
    });
  } catch (error) {
    console.error("Error fetching reserved items or sending email:", error);
  }
  console.log("Data fetching complete.");
}

// Call the fetchReservedItems function when the page loads
window.addEventListener("DOMContentLoaded", fetchReservedItems);
