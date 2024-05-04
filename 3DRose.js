function appear() {
    const elements = document.querySelectorAll('.transfadein');
    elements.forEach((element) => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)'; /* Set the final position */
    });
  }
  
appear();

const resetBtn = document.getElementById("reset-btn");
// const stellaruneBtn = document.getElementById("stellarune-btn");
// const freefall2Btn = document.getElementById("freefall2-btn");
// const blogsBtn = document.getElementById("blogs-btn");
// const aboutBtn = document.getElementById("About-btn");
// const HomoLudenBtn = document.getElementById("homo-ludens");

resetBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0, // Scrolls to the top of the page
      behavior: 'smooth' // Smooth scroll
    });
});
  