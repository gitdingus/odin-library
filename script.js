const openAddBookModalButton = document.querySelector("#open-add-book-modal");
const cancelAddBookModalButton = document.querySelector("#cancel-add-book-button");
const addBookForm = document.querySelector("#add-book-form");
const addBookModal = document.querySelector("#add-book-modal");
const bookTitleInput = document.querySelector("#book-title");
const bookAuthorInput = document.querySelector("#book-author");
const bookPagesInput = document.querySelector("#book-pages");
const bookReadInput = document.querySelector("#book-read");
const bookList = document.querySelector("#book-list");
const bookRowTemplate = document.querySelector("#book-row");

openAddBookModalButton.addEventListener("click", () => {
    addBookModal.classList.toggle("open");
});

addBookModal.addEventListener("click", (e) => {
    //Only want the add book dialog to disappear if user clicked out of it.
    if (e.target !== addBookModal){
        return;
    }
    addBookModal.classList.toggle("open");

});

cancelAddBookModalButton.addEventListener("click", () =>{
    addBookModal.classList.toggle("open");
});

addBookForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addBookToLibrary();

    //Form doesn't reset after call to preventDefault
    addBookForm.reset();

    addBookModal.classList.toggle("open");
});


let myLibrary = [];

myLibrary.push(new Book("Lord of the Rings", "J.R.R. Tolkien", 323, true));
myLibrary.push(new Book("Game of Thrones", "George R.R. Martin", 887, false));
myLibrary.push(new Book("Harry Potter", "J.K. Rowling", 411, true));
myLibrary.push(new Book("Moby Dick", "Herman Melville", 100, false));

displayBooks();

function Book(title, author, numPages, read){
    this.title = title;
    this.author = author;
    this.numPages = numPages;
    this.read = read;
}

Book.prototype.info = function(){
    return `${this.title} by ${this.author}, ${this.numPages}, ${this.read === true ? "read" : "not yet read"}`;
}

function addBookToLibrary(){
    let title = bookTitleInput.value;
    let author = bookAuthorInput.value;
    let numPages = bookPagesInput.value;
    let read = bookReadInput.checked;

    let newBook = new Book(title, author, numPages, read);

    myLibrary.push(newBook);
    displayAddedBook(newBook, myLibrary.length - 1, myLibrary);
}

function displayBooks(){
    // Make sure list is clear before adding more so it doesn't pile on duplicate listings
    clearBookList();

    myLibrary.forEach( (book, i, arr) => {
        let newRow = createBookRow(book, i, arr);
        bookList.appendChild(newRow);
    });
}

function displayAddedBook(newBook, i, arr){
    let newRow = createBookRow(newBook, i, arr);
    bookList.appendChild(newRow);
}
function createBookRow(book, i, arr){
    const bookRow = bookRowTemplate.content.cloneNode(true);
    const row = bookRow.querySelector("tr");
    const cell = bookRow.querySelectorAll("td");

    row.setAttribute("data-index", i);
    cell[0].textContent = book.title;
    cell[1].textContent = book.author;
    cell[2].textContent = book.numPages ? book.numPages : '-';
    cell[3].textContent = book.read ? "✔" : "";
    cell[4].addEventListener("click", (e) => { 
        e.stopPropagation();
        removeBook(row);
    });

    return bookRow;
}

function removeBook(row){
    let index = Number(row.getAttribute("data-index"));

    myLibrary.splice(index, 1);

    displayBooks();
    

}

function clearBookList(){
    const rows = bookList.querySelectorAll("tr");

    rows.forEach( item => {
        bookList.removeChild(item);
    })
}