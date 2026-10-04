let inputBox = document.querySelector(".input-box");
let buttons = document.querySelectorAll(".btn");

string = ''

buttons.forEach((btn) => {
    btn.addEventListener("click",  (b) => {
        if( b.target.innerHTML =="="){
            string = String(eval(string));
            inputBox.value = string;
        }else if ( b.target.innerHTML == "AC"){
            string = '';
            inputBox.value = string;
        } else if (b.target.innerHTML == "DEL"){
            string = string.substring(0, string.length-1);
            inputBox.value = string;
        }
         else {
            string += b.target.innerHTML;
            inputBox.value = string;
        };
    });
});