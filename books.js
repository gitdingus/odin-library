function Book(title, author, numPages, read){
    this.title = title;
    this.author = author;
    this.numPages = numPages;
    this.read = read;

    this.info = function() {
        return `${title} by ${author}, ${numPages}, ${read === true ? "read" : "not yet read"}`;
    }
}
