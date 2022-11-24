import React from 'react';
import ReactDOM from 'react-dom/client';
import Login from './components/Login.jsx';
import { v4 as uuid } from 'uuid';
import firebaseConfig from './firebase.config.js';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
} from 'firebase/auth';
import './style.css';
import trashPng from './trash-can-outline.png';


const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const loginContainer = document.querySelector('#user-login');
const root = ReactDOM.createRoot(loginContainer);
let currentUser = null;

function renderLogin() {
    root.render(
        <React.StrictMode>
            <Login
                user={currentUser}
                login={authHelpers.loginUser}
                createUser={authHelpers.createUser}
                signOut={authHelpers.signOutUser}
            />
        </React.StrictMode>
    );
}

const unsubscribeToAuth = onAuthStateChanged(firebaseAuth, (user) => {
    currentUser = user;
    renderLogin(currentUser);
});

const authHelpers = (function helpersForFirebaseAuth() {
    function loginUser({username, password}) {
        signInWithEmailAndPassword(firebaseAuth, username, password);
    }

    function createUser({username, password}) {
        createUserWithEmailAndPassword(firebaseAuth, username, password);
    }

    function signOutUser() {
        signOut(firebaseAuth);
    }

    return {
        loginUser, createUser, signOutUser
    }
})();

renderLogin(currentUser);

class Book {
    constructor(title, author, numPages, read){
        this.title = title;
        this.author = author;
        this.numPages = numPages;
        this.read = read;
    }

    info () {
        return `${this.title} by ${this.author}, ${this.numPages}, ${this.read === true ? "read" : "not yet read"};`
    }

    toggleRead () {
        this.read = this.read ? false : true;
    }

    static compareTitles (book1, book2){
        if (book1.title < book2.title){
            return -1;
        }
        else if(book1.title > book2.title){
            return 1;
        }
        else if (book1.title === book2.title){
            return 0;
        }
    }
    
    static compareAuthor (book1, book2){
        if (book1.author < book2.author){
            return -1;
        }
        else if(book1.author > book2.author){
            return 1;
        }
        else if (book1.author === book2.author){
            return 0;
        }
    }

    static sameBook (book1, book2){

        if (book1.title !== book2.title 
            || book1.author !== book2.author
            || book1.numPages !== book2.numPages
            || book1.read !== book2.read){
            return false;
        }
        else{
            return true;
        }


    }
}

const Library = (function (){

    const _myLibrary = [];
    let _lastBookAdded = {};

    function getBooks(){
        return _myLibrary;
    }

    function addBook(book){
        book.id = uuid();
        _myLibrary.push(book);
        _lastBookAdded = book;
    }   
    
    function addBookFromInfo(title, author, numPages, read){
        const book = new Book(title, author, numPages, read);
        addBook(book);
    }

    function removeBook(index){
        const bookIndex = _myLibrary.findIndex((book) => book.id === index);
        _myLibrary.splice(bookIndex, 1);
    }

    function sortLibrary(byField){
        let comparator = undefined;

        if (byField === "title"){
            comparator = Book.compareTitles;
        }
        else if (byField === "author"){
            comparator = Book.compareAuthor;
        }
    
        if (comparator !== undefined){
            _myLibrary.sort(comparator);
        }
    
        return getBooks();
    }

    function toggleReadStatus(index) { 
        const bookIndex = _myLibrary.findIndex((book) => book.id === index);
        _myLibrary[bookIndex].toggleRead();
    }

    function type() {
        return 'volatile-library';
    }

    return {
        getBooks, 
        addBook, 
        addBookFromInfo,
        removeBook, 
        sortLibrary,
        toggleReadStatus,
        type,
    }

})();

const libraryController = ( function (){
    const _openAddBookModalButton = document.querySelector("#open-add-book-modal");
    const _cancelAddBookModalButton = document.querySelector("#cancel-add-book-button");
    const _addBookForm = document.querySelector("#add-book-form");
    const _addBookModal = document.querySelector("#add-book-modal");
    const _bookTitleInput = document.querySelector("#book-title");
    const _bookAuthorInput = document.querySelector("#book-author");
    const _bookPagesInput = document.querySelector("#book-pages");
    const _bookReadInput = document.querySelector("#book-read");
    const _bookList = document.querySelector("#book-list");
    const _bookRowTemplate = document.querySelector("#book-row");
    const _titleHeader = document.querySelector("thead .title p");
    const _authorHeader = document.querySelector("thead .author p");

    let myLibrary = [ new Book("Lord of the Rings", "J.R.R. Tolkien", 323, true),
                      new Book("Game of Thrones", "George R.R. Martin", 887, false),
                      new Book("Harry Potter", "J.K. Rowling", 411, true),
                      new Book("Moby Dick", "Herman Melville", 100, false)
                    ];


    Library.addBooks(myLibrary);

    _displayBooks();

    _addBookForm.addEventListener("submit", (e) => {
        e.preventDefault();
        addBookToLibrary();
    
        //Form doesn't reset after call to preventDefault
        _addBookForm.reset();
    
        _addBookModal.classList.toggle("open");
    });

    _titleHeader.addEventListener("click", () => {
        Library.sortLibrary("title");
        _displayBooks();
    });
    
    _authorHeader.addEventListener("click", () => {
        Library.sortLibrary("author");
        _displayBooks();
    });

    _openAddBookModalButton.addEventListener("click", () => {
       _addBookModal.classList.toggle("open");
    });

    _addBookModal.addEventListener("click", (e) => {
        //Only want the add book dialog to disappear if user clicked out of it.
        if (e.target !== _addBookModal){
            return;
        }
        _addBookModal.classList.toggle("open");
    
    });

    _cancelAddBookModalButton.addEventListener("click", () =>{
        _addBookModal.classList.toggle("open");
    });
    
    function addBookToLibrary(){
        let title = _bookTitleInput.value;
        let author = _bookAuthorInput.value;
        let numPages = _bookPagesInput.value;
        let read = _bookReadInput.checked;
    
        let newBook = new Book(title, author, numPages, read);
    
        Library.addBook(newBook);
        displayAddedBook(newBook, myLibrary.length - 1, myLibrary);
    }

    function _clearBookList(){
        const rows = _bookList.querySelectorAll("tr");
    
        rows.forEach( item => {
            _bookList.removeChild(item);
        });
    }

    function _createBookRow(book, i, arr){
        const bookRow = _bookRowTemplate.content.cloneNode(true);
        const trashImg = bookRow.querySelector('img');

        const row = bookRow.querySelector("tr");
        const cell = bookRow.querySelectorAll("td");
    
        row.setAttribute("data-index", i);
        cell[0].textContent = book.title;
        cell[1].textContent = book.author;
        cell[2].textContent = book.numPages ? book.numPages : '-';
        cell[3].textContent = book.read ? "✔" : "-";
    
        cell[3].addEventListener("click", (e) => {
            book.toggleRead();
            cell[3].textContent = book.read ? "✔" : "-";
        });
    
        trashImg.src = trashPng;
        cell[4].addEventListener("click", (e) => { 
            e.stopPropagation();
            removeBook(row);
        });
    
        return bookRow;
    }

    function _displayBooks(){
        // Make sure list is clear before adding more so it doesn't pile on duplicate listings
        _clearBookList();
    

        Library.getBooks().forEach( (book, i, arr) => {
            let newRow = _createBookRow(book, i, arr);
            _bookList.appendChild(newRow);
        });
    }

    function displayAddedBook(newBook, i, arr){
        let newRow = _createBookRow(newBook, i, arr);
        _bookList.appendChild(newRow);
    }

    function removeBook(row){
        let index = Number(row.getAttribute("data-index"));
    
        Library.removeBook(index);
    
        _displayBooks();
        
    
    }
    
    
    
})();
