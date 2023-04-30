const toggleSwitch = document.querySelector('.switch input[type="checkbox"]');
const body = document.querySelector('body');
const navbar = document.querySelector('.navbar');
const navLinks = document.querySelectorAll('.nav-link a');

// Get the current theme from local storage
const currentTheme = localStorage.getItem('theme');

// Check if it's currently between 10 pm and 6 am
function isNightTime() {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 18 || currentHour < 6;
}

// If dark mode is not set in local storage, set it based on the time of day
if (!currentTheme) {
    if (isNightTime()) {
        localStorage.setItem('theme', 'dark');
        toggleSwitch.checked = true;
        body.classList.add('dark-mode');
        navbar.classList.remove('navbar-light', 'bg-light');
        navbar.classList.add('navbar-dark', 'bg-dark');
        navLinks.forEach(link => link.classList.add('dark-mode'));
    } else {
        localStorage.setItem('theme', 'light');
    }
}

// If the current theme is dark, set the toggle to on
if (currentTheme === 'dark') {
    toggleSwitch.checked = true;
    body.classList.add('dark-mode');
    navbar.classList.remove('navbar-light', 'bg-light');
    navbar.classList.add('navbar-dark', 'bg-dark');
    navLinks.forEach(link => link.classList.add('dark-mode'));
}

function switchTheme(e) {
    if (e.target.checked) {
        // Add dark mode class to body, navbar, and links
        body.classList.add('dark-mode');
        navbar.classList.remove('navbar-light', 'bg-light');
        navbar.classList.add('navbar-dark', 'bg-dark');
        navLinks.forEach(link => link.classList.add('dark-mode'));

        // Store current theme value in local storage
        localStorage.setItem('theme', 'dark');
    } else {
        // Remove dark mode class from body, navbar, and links
        body.classList.remove('dark-mode');
        navbar.classList.remove('navbar-dark', 'bg-dark');
        navbar.classList.add('navbar-light', 'bg-light');
        navLinks.forEach(link => link.classList.remove('dark-mode'));

        // Store current theme value in local storage
        localStorage.setItem('theme', 'light');
    }
}

toggleSwitch.addEventListener('change', switchTheme, false);

// function 
function displayCurrentDay() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDate = new Date();
    const currentDay = currentDate.getDay();
  
    const dayElement = document.getElementById('message');
    dayElement.innerText = days[currentDay];
  
    const colors = ['#FF5733', '#FFBD33', '#DBFF33', '#75FF33', '#33FF57', '#33FFBD', '#3375FF'];
    const fonts = ['Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Georgia'];
  
    dayElement.style.color = colors[currentDay];
    dayElement.style.fontFamily = fonts[currentDay];
}
  
displayCurrentDay();
