function appear() {
  const elements = document.querySelectorAll('.transfadein');
  elements.forEach((element) => {
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)'; /* Set the final position */
  });
}

appear();

const blogsBtn = document.getElementById("blogs-btn");
const xiaoBtn = document.getElementById("homo-ludens");



blogsBtn.addEventListener("click", () => {
  window.open("./xiaoblogs.html", "_self");
});


xiaoBtn.addEventListener("click", function () {
  window.location.href = "./index.html";
});