let loginIdentifier = document.querySelector("#identifier");
let loginPassword = document.querySelector("#password");
let books = document.querySelector(".books");
let registerUsername = document.querySelector("#registerUsername");
let registerEmail = document.querySelector("#registerEmail");
let registerPassword = document.querySelector("#registerPassword");
let welcomeMessage = document.querySelector("#welcomeMessage");

const register = async () => {
    try {
        let response = await axios.post(
            "http://localhost:1338/api/auth/local/register",
            {
                username:registerUsername.value,
                password:registerPassword.value, 
                email:registerEmail.value,
            });
        console.log(response.data);
        sessionStorage.setItem("token", response.data.jwt);
        registerUsername.value = "";
        registerPassword.value = "";
        registerEmail.value = "";
    } catch (error) {
        console.error(error);
    }
};

const login = async () => {
    try {
      let response = await axios.post("http://localhost:1338/api/auth/local", {
        identifier: loginIdentifier.value,
        password: loginPassword.value,
      });
      sessionStorage.setItem("token", response.data.jwt);
      sessionStorage.setItem("loginId", response.data.user.id);
      sessionStorage.setItem("userName",response.data.user.username );
      books.innerHTML ="";
      renderPage();
    
      welcomeMessage.innerHTML = `&#128100;Welcome  ${response.data.user.username}`;
      books.insertAdjacentElement("afterbegin", welcomeMessage);
      
      const loginContainer = document.getElementById("loginContainer");
      loginContainer.style.display = "none";
    } catch (error) {
        console.error(error);
    }
    
    document.getElementById("logoutButton").removeAttribute("hidden");
    document.getElementById("profile").removeAttribute("hidden");
};

let loggedIn = () => {
  
    if(sessionStorage.getItem("token")){
        loginContainer.style.display = "none";
        welcomeMessage.innerHTML = "&#128100;Logged in as " + sessionStorage.getItem("userName");
        books.insertAdjacentElement("afterbegin", welcomeMessage);
        document.getElementById("logoutButton").removeAttribute("hidden");
    } else {
        // loginDiv.classlist.add("hidden");
        // registerDiv.classlist.add("hidden");
        
    }
}
loggedIn();
  

let renderPage = async () => {
    let response = await axios.get("http://localhost:1338/api/books?populate=deep,3");
  
    response.data.data.forEach((book, i) => {
      let bookDiv = document.createElement("div");
      bookDiv.classList.add("bookDiv");
      bookDiv.innerHTML += `
        <h3>${book.attributes.title}</h3>
        <img src="http://localhost:1338${book.attributes.cover.data[0].attributes.url}"> 
        <p> Författare: ${book.attributes.author} </p>
        <p> Antal sidor: ${book.attributes.pages} sidor </p>
        <p> Snittbetyg: ${book.attributes.rating} </p>
        <p> Utgivningsdatum: ${book.attributes.dateOfRealese} </p>
        <button id="saveBook${book.id}" class="saveBook bookBtn">Save</button>
      `;
      let ratingSelect = document.createElement("select");

      if (sessionStorage.getItem("token")){
        ratingSelect.style.display = "block";
      }else{
        ratingSelect.style.display = "none";
      }
  
      ratingSelect.id = `rating-${book.id}`;
      ratingSelect.innerHTML = `
      <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>`
      ;

      ratingSelect.addEventListener("change", () => {
        rateBook(book.id, ratingSelect.value);
        
      });

      bookDiv.appendChild(ratingSelect);
      books.appendChild(bookDiv);
      
    });
    bookMark();
  };
  renderPage();

  
const rateBook = async (bookId, rating) => {
    const userId = sessionStorage.getItem("loginId");
  
    await axios.post(`http://localhost:1338/api/user-ratings`, {
      data: {
        rating: rating,
        books: {
          connect: [bookId],
        },
        users: {
          connect: [userId],
        }
      }
    });
  
    
    const response = await axios.get(`http://localhost:1338/api/user-ratings?filter[books]=${bookId}&populate=books`);
    console.log(response);
  
    let totalRating = 0;
    const ratings = response.data.data.filter(ratingObj => ratingObj.attributes.books.data[0].id === bookId);
    for (const ratingObj of ratings) {
      totalRating += ratingObj.attributes.rating;
    }
  
    let averageRating = totalRating / ratings.length;
    averageRating = Math.round(averageRating);
  
    await axios.put(`http://localhost:1338/api/books/${bookId}`, {
      data: {
        rating: averageRating,
      }
    });
  };
  
  

const bookMark = async () => {
    let bookmarkBtn =  document.querySelectorAll(".saveBook");
    for (let button of bookmarkBtn) {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        let books = e.target.id.replace("saveBook", "");
        console.log(books);
        books = parseInt(books);
        console.log(books);
        let userId = sessionStorage.getItem("loginId");
      
    await axios.put(`http://localhost:1338/api/books/${books}`, {
        data: {
            users: { 
                connect: [userId],
              },
              
          }
      });
      
  })
} 
  };
  let favoritebooks = document.querySelector("#favoriteBooks");
  let profile = document.querySelector("#profile");

  profile.addEventListener("click", async ()=> {
    books.style.display = "none";
    let userId = sessionStorage.getItem("loginId");
    let response = await axios.get("http://localhost:1338/api/users/me?populate=deep,3", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        });
    let data = response.data;
    console.log(data);
    data.books.forEach((book, i) => {
        let profileDiv = document.createElement("div");
        profileDiv.classList.add("profileDiv");
        profileDiv.innerHTML = `
    <h3>Titel: ${book.title}</h3>
   <img src="http://localhost:1338${book.cover[0].url}">
    <p> Författare: ${book.author} </p>
    <p> Antal sidor: ${book.pages} sidor </p>
    <p> Snittbetyg: ${book.rating} </p>
    <p> Utgivningsdatum: ${book.dateOfRealese} </p>
    `;
    favoritebooks.appendChild(profileDiv);
})
});

    
    const logout = () => {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("loginId");
      sessionStorage.removeItem("userName");
      location.reload();

    };
    


