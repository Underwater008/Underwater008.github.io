
/////// Fade in Content //////
function appear() {
    const elements = document.querySelectorAll('.transfadein');
    elements.forEach((element) => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)'; /* Set the final position */
    });
}

appear();

////// Blogs //////
const blogWelcome = document.querySelector('.blog-welcome');
////// Buttons //////
const resetBtn = document.getElementById("reset-btn");
const toolsBtn = document.getElementById("toolsBtn");
const gamesBtn = document.getElementById("gamesBtn");
const lifeBtn = document.getElementById("lifeBtn");

const blogButtonsArray = [
    toolsBtn,
    gamesBtn,
    lifeBtn
];

////// Hide all blogs //////
function resetAllBlogs() {
    blogButtonsArray.forEach(button => {
        button.style.backgroundColor = '#f9f9f9';
    });
    const blogBlocks = document.querySelectorAll('.blog-block');
    blogBlocks.forEach((element) => {
        element.style.opacity = '0';
        element.style.display = 'none';
    });
    blogWelcome.style.display = 'block';
    blogWelcome.style.opacity = '1';
}
resetAllBlogs();

////// Blogs Logic //////
function showToolBlogs() {
    resetAllBlogs();
    blogButtonsArray.forEach(button => {
        button.style.backgroundColor = '#f9f9f9';
        toolsBtn.style.backgroundColor = '#a70000de';
    });
    const toolsBlogsContainer = document.querySelector('.tools-blogs');
    const blogBlocks = toolsBlogsContainer.querySelectorAll('.blog-block');
    blogBlocks.forEach((toolBlog) => {
        toolBlog.style.display = 'block';
        toolBlog.style.opacity = '1';
    });
    blogWelcome.style.display = 'none';
}

function showGameBlogs() {
    resetAllBlogs();
    blogButtonsArray.forEach(button => {
        button.style.backgroundColor = '#f9f9f9';
        gamesBtn.style.backgroundColor = '#a70000de';
    });
    const gamesBlogsContainer = document.querySelector('.games-blogs');
    const blogBlocks = gamesBlogsContainer.querySelectorAll('.blog-block');
    blogBlocks.forEach((gameBlog) => {
        gameBlog.style.display = 'block';
        gameBlog.style.opacity = '1';
    });
    blogWelcome.style.display = 'none';
}

function showLifeBlogs() {
    resetAllBlogs();
    blogButtonsArray.forEach(button => {
        button.style.backgroundColor = '#f9f9f9';
        lifeBtn.style.backgroundColor = '#a70000de';
    });
    const lifesBlogsContainer = document.querySelector('.lifes-blogs');
    const blogBlocks = lifesBlogsContainer.querySelectorAll('.blog-block');
    blogBlocks.forEach((lifeBlog) => {
        lifeBlog.style.display = 'block';
        lifeBlog.style.opacity = '1';
    });
    blogWelcome.style.display = 'none';
}

// function updateContent(content) {
//     const mediaContainer = document.getElementById('xab-right');
//     mediaContainer.innerHTML = content;
// }

////// Buttons Logic //////
resetBtn.addEventListener("click", () => {
    resetAllBlogs();
});

toolsBtn.addEventListener('click', () => {
    showToolBlogs();
});

gamesBtn.addEventListener('click', () => {
    showGameBlogs();
});

lifeBtn.addEventListener('click', () => {
    showLifeBlogs();
});


document.getElementById("hkblogBtn").addEventListener("click", function () {
    window.location.href = "./blog1.html";
});

document.getElementById("hkblogBtn2").addEventListener("click", function () {
    window.location.href = "./blog1.html";
});