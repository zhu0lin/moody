/* === Imports === */
import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, query, where, orderBy } from "firebase/firestore";


/* === Firebase Setup === */
const firebaseConfig = {
    apiKey: "AIzaSyCEeJADVzPhG2c6j6gXP7Q9fNGwCztYGy4",
    authDomain: "moody-72066.firebaseapp.com",
    projectId: "moody-72066",
    storageBucket: "moody-72066.firebasestorage.app",
    messagingSenderId: "384758590647",
    appId: "1:384758590647:web:d136ee944b589845597132"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

/* === UI === */

/* == UI - Elements == */

const viewLoggedOut = document.getElementById("logged-out-view")
const viewLoggedIn = document.getElementById("logged-in-view")

const signInWithGoogleButtonEl = document.getElementById("sign-in-with-google-btn")

const emailInputEl = document.getElementById("email-input")
const passwordInputEl = document.getElementById("password-input")

const signInButtonEl = document.getElementById("sign-in-btn")
const createAccountButtonEl = document.getElementById("create-account-btn")

const signOutButtonEl = document.getElementById("sign-out-btn")

const userProfilePictureEl = document.getElementById("user-profile-picture")
const userGreetingEl = document.getElementById("user-greeting")

const displayNameInputEl = document.getElementById("display-name-input")
const photoURLInputEl = document.getElementById("photo-url-input")
const updateProfileButtonEl = document.getElementById("update-profile-btn")

const moodEmojiEls = document.getElementsByClassName("mood-emoji-btn")
const textareaEl = document.getElementById("post-input")
const postButtonEl = document.getElementById("post-btn")

const allFilterButtonEl = document.getElementById("all-filter-btn")

const filterButtonEls = document.getElementsByClassName("filter-btn")

const postsEl = document.getElementById("posts")

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)

signInButtonEl.addEventListener("click", authSignInWithEmail)
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)

signOutButtonEl.addEventListener("click", authSignOut)

// updateProfileButtonEl.addEventListener("click", authUpdateProfile)

for (let moodEmojiEl of moodEmojiEls) {
    moodEmojiEl.addEventListener("click", selectMood)
}

for (let filterButtonEl of filterButtonEls) {
    filterButtonEl.addEventListener("click", selectFilter)
}

postButtonEl.addEventListener("click", postButtonPressed)



/* === State === */

let moodState = 0

/* === Global Constants === */

const collectionName = "posts";

/* === Main Code === */
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        showLoggedInView()
        showProfilePicture(userProfilePictureEl, user)
        showUserGreeting(userGreetingEl, user)
        updateFilterButtonStyle(allFilterButtonEl)
        fetchAllPosts(user)
        // ...
    } else {
        // User is signed out
        // ...
        showLoggedOutView()
    }
});

/* === Functions === */

/* = Functions - Firebase - Authentication = */

function authSignInWithGoogle() {
    console.log("Sign in with Google")

    signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            console.log("Signed in with Google")
            // IdP data available using getAdditionalUserInfo(result)
            // ...
        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            console.log(`Error code: ${errorCode}. Error message: ${errorMessage}`)
            // ...
        });
}

function authSignInWithEmail() {
    console.log("Sign in with email and password")

    const email = emailInputEl.value;
    const password = passwordInputEl.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            clearAuthFields();
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(`${errorCode} : ${errorMessage}`);
        });

}

function authCreateAccountWithEmail() {
    console.log("Sign up with email and password")

    const email = emailInputEl.value;
    const password = passwordInputEl.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            clearAuthFields();
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(`${errorCode} : ${errorMessage}`);
        });

}

function authSignOut() {
    /*  Challenge:
        Import the signOut function from 'firebase/auth'

        Use the code from the documentaion to make this function work.
       
        If the log out is successful then you should show the logged out view using showLoggedOutView()
        If something went wrong, then you should log the error message using console.error.
    */
    signOut(auth).then(() => {
        // Sign-out successful.
        clearAuthFields();
    }).catch((error) => {
        // An error happened.
        console.log(error);
    });

}

function authUpdateProfile() {
    /*  Challenge:
        Import the updateProfile function from 'firebase/auth'
    
        Use the documentation to make this function work.
        
        Make sure to first create two consts, 'newDisplayName' and 'newPhotoURL', to fetch the values from the input fields displayNameInputEl and photoURLInputEl.
        
        If the updating of profile is successful then you should console log "Profile updated".
        If something went wrong, then you should log the error message using console.error
        
        Resources:
        Justin Bieber profile picture URL: https://i.imgur.com/6GYlSed.jpg
    */
    const newDisplayName = displayNameInputEl.value;
    const newPhotoURL = photoURLInputEl.value;
    updateProfile(auth.currentUser, {
        displayName: newDisplayName, photoURL: newPhotoURL
    }).then(() => {
        // Profile updated!
        // ...
        console.log("Profile updated")
    }).catch((error) => {
        // An error occurred
        // ...
        console.log(error)
    });
}

/* = Functions - Firebase - Cloud Firestore = */

async function addPostToDB(postBody, user) {
    /*  Challenge:
        Import collection and addDoc from 'firebase/firestore'

        Use the code from the documentaion to make this function work.
        
        The function should add a new document to the "posts" collection in Firestore.
        
        The document should contain a field called 'body' of type "string" with a value of
        postBody (from function parameter)
        
        If the document was written successfully, then console log
        "Document written with ID: {documentID}"
        Where documentID is the actual ID of the newly created document.
        
        If something went wrong, then you should log the error message using console.error
    */
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            body: postBody,
            uid: user.uid,
            createdAt: serverTimestamp(),
            mood: moodState
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function updatePostInDB(docId, newBody) {
    /* Challenge:
        Import updateDoc and doc from 'firebase/firestore'
        
        Use the code from the documentation to make this function work.
        
        The function should update the correct post in the database using the docId.
        
        The body field should be updated with newBody as the new value.
     */
    const postRef = doc(db, collectionName, docId)

    await updateDoc(postRef, {
        body: newBody
    })
}

async function deletePostFromDB(docId) {
    /* Challenge:
        Import deleteDoc and doc from 'firebase/firestore'
        
        Use the code from the documentation to make this function work.
        
        The function should delete the correct post in the database using the docId
     */
    await deleteDoc(doc(db, collectionName, docId))
}

function fetchInRealtimeAndRenderPostsFromDB(query, user) {

    onSnapshot(query, (querySnapshot) => {
        clearAll(postsEl)
        querySnapshot.forEach(doc => {
            renderPost(postsEl, doc)
        })
    })
}

function fetchTodayPosts(user) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const postsRef = collection(db, collectionName)

    const q = query(postsRef, where("uid", "==", user.uid),
        where("createdAt", ">=", startOfDay),
        where("createdAt", "<=", endOfDay), orderBy("createdAt", "desc"))

    fetchInRealtimeAndRenderPostsFromDB(q, user)
}

function fetchWeekPosts(user) {
    const startOfWeek = new Date()
    startOfWeek.setHours(0, 0, 0, 0)

    if (startOfWeek.getDay() === 0) { // If today is Sunday
        startOfWeek.setDate(startOfWeek.getDate() - 6) // Go to previous Monday
    } else {
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
    }

    /*
        Challenge:
        Finish implementing the rest of the function.
        Set the endOfDay.
        Create a postsRef.
        Create a query.
        Call the fetchRealtimeAndRenderPostsFromDB with query and user as arguments.
        
        Hint: Use fetchTodayPosts
     */
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const postsRef = collection(db, collectionName)
    const q = query(postsRef, where("uid", "==", user.uid),
        where("createdAt", ">=", startOfWeek),
        where("createdAt", "<=", endOfDay), orderBy("createdAt", "desc"))

    fetchInRealtimeAndRenderPostsFromDB(q, user)
}

function fetchMonthPosts(user) {
    const startOfMonth = new Date()
    startOfMonth.setHours(0, 0, 0, 0)
    startOfMonth.setDate(1)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const postsRef = collection(db, collectionName)

    const q = query(postsRef, where("uid", "==", user.uid),
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<=", endOfDay),
        orderBy("createdAt", "desc"))

    fetchInRealtimeAndRenderPostsFromDB(q, user)
}

function fetchAllPosts(user) {
    /* Challenge:
        This function should fetch ALL posts from the database and render them using the fetchRealtimeAndRenderPostsFromDB function.
    */
    const postsRef = collection(db, collectionName)

    const q = query(postsRef, where("uid", "==", user.uid),
        orderBy("createdAt", "desc"))

    fetchInRealtimeAndRenderPostsFromDB(q, user)
}


/* == Functions - UI Functions == */

function createPostHeader(postData) {
    /*
        <div class="header">
        </div>
    */
    const headerDiv = document.createElement("div")
    headerDiv.className = "header"

    /* 
        <h3>21 Sep 2023 - 14:35</h3>
    */
    const headerDate = document.createElement("h3")
    headerDate.textContent = displayDate(postData.createdAt)
    headerDiv.appendChild(headerDate)

    /* 
        <img src="assets/emojis/5.png">
    */
    const moodImage = document.createElement("img")
    moodImage.src = `/assets/emojis/${postData.mood}.png`
    headerDiv.appendChild(moodImage)

    return headerDiv
}

function createPostBody(postData) {
    /*
        <p>This is a post</p>
    */
    const postBody = document.createElement("p")
    postBody.innerHTML = replaceNewlinesWithBrTags(postData.body)

    return postBody
}

function createPostUpdateButton(wholeDoc) {
    const postID = wholeDoc.id
    const postData = wholeDoc.data()
    /* 
        <button class="edit-color">Edit</button>
    */
    const button = document.createElement("button")
    button.textContent = "Edit"
    button.classList.add("edit-color")
    button.addEventListener("click", function () {
        const newBody = prompt("Edit the post", postData.body)

        if (newBody) {
            updatePostInDB(postID, newBody)
        }

    })

    return button
}

function createPostDeleteButton(wholeDoc) {
    const postId = wholeDoc.id
    
    /* 
        <button class="delete-color">Delete</button>
    */
    const button = document.createElement('button')
    button.textContent = 'Delete'
    button.classList.add("delete-color")
    button.addEventListener('click', function() {
        deletePostFromDB(postId)
    })
    return button
}

function createPostFooter(wholeDoc) {
    /* 
        <div class="footer">
            <button>Edit</button>
        </div>
    */
    const footerDiv = document.createElement("div")
    footerDiv.className = "footer"

    footerDiv.appendChild(createPostUpdateButton(wholeDoc))
    footerDiv.appendChild(createPostDeleteButton(wholeDoc))

    return footerDiv
}

function renderPost(postsEl, wholeDoc) {
    const postData = wholeDoc.data()

    const postDiv = document.createElement("div")
    postDiv.className = "post"

    postDiv.appendChild(createPostHeader(postData))
    postDiv.appendChild(createPostBody(postData))
    postDiv.appendChild(createPostFooter(wholeDoc))

    postsEl.appendChild(postDiv)
}

function replaceNewlinesWithBrTags(inputString) {
    // Challenge: Use the replace method on inputString to replace newlines with break tags and return the result
    return inputString.replace(/\n/g, "<br>")
}

function postButtonPressed() {
    const postBody = textareaEl.value
    const user = auth.currentUser

    if (postBody && moodState) {
        addPostToDB(postBody, user)
        clearInputField(textareaEl)
        resetAllMoodElements(moodEmojiEls)
    }
}

function clearAll(element) {
    element.innerHTML = ""
}

function showLoggedOutView() {
    hideView(viewLoggedIn)
    showView(viewLoggedOut)
}

function showLoggedInView() {
    hideView(viewLoggedOut)
    showView(viewLoggedIn)
}

function showView(view) {
    view.style.display = "flex"
}

function hideView(view) {
    view.style.display = "none"
}

function clearInputField(field) {
    field.value = ""
}

function clearAuthFields() {
    clearInputField(emailInputEl)
    clearInputField(passwordInputEl)
}

function showProfilePicture(imgElement, user) {
    /*  Challenge:
        Use the documentation to make this function work.
        
        This function has two parameters: imgElement and user
        
        We will call this function inside of onAuthStateChanged when the user is logged in.
        
        The function will be called with the following arguments:
        showProfilePicture(userProfilePictureEl, user)
        
        If the user has a profile picture URL, set the src of imgElement to that URL.
        
        Otherwise, you should set the src of imgElement to "assets/images/default-profile-picture.jpeg"
    */
    if (user !== null) {
        userProfilePictureEl.src = user.photoURL;
    }
    else {
        userProfilePictureEl.src = "assets/images/default-profile-picture.jpeg";
    }
}

function showUserGreeting(element, user) {
    /*  Challenge:
        Use the documentation to make this function work.
        
        This function has two parameters: element and user
        
        We will call this function inside of onAuthStateChanged when the user is logged in.
        
        The function will be called with the following arguments:
        showUserGreeting(userGreetingEl, user)
        
        If the user has a display name, then set the textContent of element to:
        "Hey John, how are you?"
        Where John is replaced with the actual first name of the user
        
        Otherwise, set the textContent of element to:
        "Hey friend, how are you?" 
    */
    if (user !== null) {
        const firstName = user.displayName.split(" ")[0]
        userGreetingEl.innerText = `Hey ${firstName}, how are you?`;
    }
    else {
        userGreetingEl.innerText = `Hey friend, how are you?`;
    }
}

function displayDate(firebaseDate) {
    if (!firebaseDate) {
        return "Date processing"
    }

    const date = firebaseDate.toDate()

    const day = date.getDate()
    const year = date.getFullYear()

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = monthNames[date.getMonth()]

    let hours = date.getHours()
    let minutes = date.getMinutes()
    hours = hours < 10 ? "0" + hours : hours
    minutes = minutes < 10 ? "0" + minutes : minutes

    return `${month} ${day} ${year} - ${hours}:${minutes}`
}

/* = Functions - UI Functions - Mood = */

function selectMood(event) {
    const selectedMoodEmojiElementId = event.currentTarget.id

    changeMoodsStyleAfterSelection(selectedMoodEmojiElementId, moodEmojiEls)

    const chosenMoodValue = returnMoodValueFromElementId(selectedMoodEmojiElementId)

    moodState = chosenMoodValue
}

function changeMoodsStyleAfterSelection(selectedMoodElementId, allMoodElements) {
    for (let moodEmojiEl of moodEmojiEls) {
        if (selectedMoodElementId === moodEmojiEl.id) {
            moodEmojiEl.classList.remove("unselected-emoji")
            moodEmojiEl.classList.add("selected-emoji")
        } else {
            moodEmojiEl.classList.remove("selected-emoji")
            moodEmojiEl.classList.add("unselected-emoji")
        }
    }
}

function resetAllMoodElements(allMoodElements) {
    for (let moodEmojiEl of allMoodElements) {
        moodEmojiEl.classList.remove("selected-emoji")
        moodEmojiEl.classList.remove("unselected-emoji")
    }

    moodState = 0
}

function returnMoodValueFromElementId(elementId) {
    return Number(elementId.slice(5))
}

/* == Functions - UI Functions - Date Filters == */

function resetAllFilterButtons(allFilterButtons) {
    for (let filterButtonEl of allFilterButtons) {
        filterButtonEl.classList.remove("selected-filter")
    }
}

function updateFilterButtonStyle(element) {
    element.classList.add("selected-filter")
}

function fetchPostsFromPeriod(period, user) {
    if (period === "today") {
        fetchTodayPosts(user)
    } else if (period === "week") {
        fetchWeekPosts(user)
    } else if (period === "month") {
        fetchMonthPosts(user)
    } else {
        fetchAllPosts(user)
    }
}

function selectFilter(event) {
    const user = auth.currentUser

    const selectedFilterElementId = event.target.id

    const selectedFilterPeriod = selectedFilterElementId.split("-")[0]

    const selectedFilterElement = document.getElementById(selectedFilterElementId)

    resetAllFilterButtons(filterButtonEls)

    updateFilterButtonStyle(selectedFilterElement)

    fetchPostsFromPeriod(selectedFilterPeriod, user)
}