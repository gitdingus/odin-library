import { EventEmitter } from 'event-emitter';
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
import {
    getFirestore,
    collection,
    doc,
    query,
    orderBy,
    addDoc,
    getDocs,
    deleteDoc,
    runTransaction,
} from 'firebase/firestore';
import './style.css';
import trashPng from './trash-can-outline.png';

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const firebaseDb = getFirestore(firebaseApp);
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

const bookFirestoreConverter = {
    toFirestore: (book) => {
        return {
            title: book.title,
            author: book.author,
            numPages: book.numPages,
            read: book.read,
        }
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);

        return (new Book(data.title, data.author, data.numPages, data.read));
    },
};


const volatileLibrary = function () {

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

}

const firebaseLibrary = function libraryBuiltOnFirebase() {
    function addBook(book) {
        const collectionRef = collection(firebaseDb, `/users/${currentUser.uid}/books/`).withConverter(bookFirestoreConverter);
        addDoc(collectionRef, book);
    }

    function addBookFromInfo(title, author, pages, read){
        const book = new Book(title, author, pages, read);
        addBook(book);
    }

    async function getBooks() {
        const collectionRef = collection(firebaseDb, `/users/${currentUser.uid}/books/`).withConverter(bookFirestoreConverter);
        const querySnapshot = await getDocs(collectionRef)

        return querySnapshot;
    }

    async function removeBook(id) {
        const collectionRef = collection(firebaseDb, `/users/${currentUser.uid}/books/`).withConverter(bookFirestoreConverter);
        const docRef = doc(collectionRef, id);

        return deleteDoc(docRef);
    }

    async function sortLibrary(byField){
        const collectionRef = collection(firebaseDb, `/users/${currentUser.uid}/books/`).withConverter(bookFirestoreConverter);

        const q = query(collectionRef, orderBy(byField, 'asc'));
        const snapshot = await getDocs(q);

        return snapshot;
    }

    async function toggleReadStatus(id) {
        const collectionRef = collection(firebaseDb, `/users/${currentUser.uid}/books/`).withConverter(bookFirestoreConverter);
        const docRef = doc(collectionRef, id);

        await runTransaction(firebaseDb, async (transaction) => {
            const bookDoc = await transaction.get(docRef);
            const newReadStatus = !bookDoc.get('read');

            transaction.update(docRef, {
                read: newReadStatus,
            });
        })
    }

    function type() {
        return 'firebase-library';
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
}


const libraryController = function (library){
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

    EventEmitter.addEvent("refreshList", _displayBooks);
    
    const _addBookFormListener = function (e) {
        e.preventDefault();
        addBookToLibrary();
    
        //Form doesn't reset after call to preventDefault
        _addBookForm.reset();
    
        _addBookModal.classList.toggle("open");
    }
    _addBookForm.addEventListener("submit", _addBookFormListener);

    const _titleHeaderListener = function () {
        if (library.type() === 'volatile-library') {
            library.sortLibrary("title");
            EventEmitter.raiseEvent("refreshList");
        } else if (library.type() === 'firebase-library') {
            library.sortLibrary('title')
                .then((snapshot) => {
                    _clearBookList();
                    snapshot.forEach((book) => {
                        const newBook = book.data();
                        newBook.id = book.id;
    
                        const newRow = _createBookRow(newBook);
                        _bookList.appendChild(newRow);
                    });
                });
        }

    }
    _titleHeader.addEventListener("click", _titleHeaderListener);
    
    const _authorHeaderListener = function () { 
        if (library.type() === 'volatile-library') {
            library.sortLibrary("author");
            EventEmitter.raiseEvent("refreshList");
        } else if (library.type() === 'firebase-library') {
            library.sortLibrary('author')
                .then((snapshot) => {
                    _clearBookList();
                    snapshot.forEach((book) => {
                        const newBook = book.data();
                        newBook.id = book.id;
    
                        const newRow = _createBookRow(newBook);
                        _bookList.appendChild(newRow);
                    });
                });
        }
    }
    _authorHeader.addEventListener("click", _authorHeaderListener);

    const _openAddBookModalButtonListener = function () {
       _addBookModal.classList.toggle("open");
    }
    _openAddBookModalButton.addEventListener("click", _openAddBookModalButtonListener);

    const _addBookModalListener = function (e) {
        //Only want the add book dialog to disappear if user clicked out of it.
        if (e.target !== _addBookModal){
            return;
        }
        _addBookModal.classList.toggle("open");
    
    }
    _addBookModal.addEventListener("click", _addBookModalListener);

    const _cancelAddBookModalButtonListener = function () {
        _addBookModal.classList.toggle("open");

    }
    _cancelAddBookModalButton.addEventListener("click", _cancelAddBookModalButtonListener);
    
    function cleanUpListeners() {
        _addBookForm.removeEventListener('submit', _addBookFormListener);
        _titleHeader.removeEventListener('click', _titleHeaderListener);
        _authorHeader.removeEventListener('click', _authorHeaderListener);
        _openAddBookModalButton.removeEventListener('click', _openAddBookModalButtonListener);
        _addBookModal.removeEventListener('click', _addBookModalListener);
        _cancelAddBookModalButton.removeEventListener('click', _cancelAddBookModalButtonListener);

        EventEmitter.removeEvent('refreshList', _displayBooks);
    }

    function addBookToLibrary(){
        let title = _bookTitleInput.value;
        let author = _bookAuthorInput.value;
        let numPages = _bookPagesInput.value;
        let read = _bookReadInput.checked;
    
        let newBook = new Book(title, author, numPages, read);
    
        library.addBook(newBook);

        EventEmitter.raiseEvent("refreshList");
    }

    function _clearBookList(){
        const rows = _bookList.querySelectorAll("tr");
    
        rows.forEach( item => {
            _bookList.removeChild(item);
        });
    }

    function _createBookRow(book){
        const bookRow = _bookRowTemplate.content.cloneNode(true);
        const trashImg = bookRow.querySelector('img');

        const row = bookRow.querySelector("tr");
        const cell = bookRow.querySelectorAll("td");
    
        row.setAttribute("data-index", book.id);
        cell[0].textContent = book.title;
        cell[1].textContent = book.author;
        cell[2].textContent = book.numPages ? book.numPages : '-';
        cell[3].textContent = book.read ? "✔" : "-";
    
        cell[3].addEventListener("click", (e) => {
            // book.toggleRead();
            // cell[3].textContent = book.read ? "✔" : "-";
            _toggleReadStatus(row.getAttribute('data-index'));

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
    
        const books = library.getBooks();

        if (Array.isArray(books)) { 
            library.getBooks().forEach( (book, i, arr) => {
                let newRow = _createBookRow(book);
                _bookList.appendChild(newRow);
            });
        } else if (books instanceof Promise){
            books.then((books) => {
                books.forEach((book) => {
                    const newBook = book.data();
                    newBook.id = book.id;

                    const newRow = _createBookRow(newBook);
                    _bookList.appendChild(newRow);
                });
            });
        }

    }

    function removeBook(row){
        let index = row.getAttribute("data-index");
    
        if (library.type() === 'volatile-library') {
            library.removeBook(index);
            EventEmitter.raiseEvent('refreshList');
        } else if (library.type() === 'firebase-library') {
            library.removeBook(index)
                .then(() => {
                    EventEmitter.raiseEvent('refreshList');
                });
        }
    }

    function _toggleReadStatus(index) {
        if (library.type() === 'volatile-library') {
            library.toggleReadStatus(index);
            EventEmitter.raiseEvent('refreshList');
        } else if (library.type() === 'firebase-library') {
            library.toggleReadStatus(index)
                .then(() => {
                    EventEmitter.raiseEvent('refreshList');
                })
        }

        
    }
    function loadBooks() {
        _displayBooks();
    }

    return {
        loadBooks,
        cleanUpListeners,
    }
};
